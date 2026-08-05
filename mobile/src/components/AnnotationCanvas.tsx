import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Annotation, AnnotationPoint, AnnotationTool } from '../types';
import { clamp01, createAnnotationId, isTwoPointTool, toNormalized } from '../evidence/annotations';

interface Props {
  width: number;
  height: number;
  annotations: Annotation[];
  /** Read-only mode is used for the gallery preview and for the flattening pass. */
  readOnly?: boolean;
  tool?: AnnotationTool;
  color?: string;
  strokeWidth?: number;
  /**
   * Fired once a stroke is released. Tools that carry text (`TEXT`, `MEASURE`) arrive
   * without a label so the parent can prompt for one before committing.
   */
  onDraft?: (annotation: Annotation) => void;
}

const ARROW_HEAD = 16;
const CALLOUT_FONT = 14;

const denormalize = (point: AnnotationPoint, width: number, height: number) => ({
  x: point.x * width,
  y: point.y * height,
});

const AnnotationShape: React.FC<{ annotation: Annotation; width: number; height: number }> = ({
  annotation,
  width,
  height,
}) => {
  const { tool, color, strokeWidth, points, label } = annotation;
  if (points.length === 0) return null;

  const scaled = points.map(p => denormalize(p, width, height));
  const start = scaled[0];
  const end = scaled[scaled.length - 1];

  switch (tool) {
    case 'ARROW': {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const wing = Math.PI / 7;
      const head = [
        `${end.x},${end.y}`,
        `${end.x - ARROW_HEAD * Math.cos(angle - wing)},${end.y - ARROW_HEAD * Math.sin(angle - wing)}`,
        `${end.x - ARROW_HEAD * Math.cos(angle + wing)},${end.y - ARROW_HEAD * Math.sin(angle + wing)}`,
      ].join(' ');
      return (
        <G>
          <Line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Polygon points={head} fill={color} />
        </G>
      );
    }

    case 'CIRCLE':
      return (
        <Ellipse
          cx={(start.x + end.x) / 2}
          cy={(start.y + end.y) / 2}
          rx={Math.abs(end.x - start.x) / 2}
          ry={Math.abs(end.y - start.y) / 2}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      );

    case 'RECT':
      return (
        <Rect
          x={Math.min(start.x, end.x)}
          y={Math.min(start.y, end.y)}
          width={Math.abs(end.x - start.x)}
          height={Math.abs(end.y - start.y)}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      );

    case 'MEASURE': {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const capX = (ARROW_HEAD / 2) * Math.sin(angle);
      const capY = (ARROW_HEAD / 2) * Math.cos(angle);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      return (
        <G>
          <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={strokeWidth} />
          <Line
            x1={start.x - capX}
            y1={start.y + capY}
            x2={start.x + capX}
            y2={start.y - capY}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Line
            x1={end.x - capX}
            y1={end.y + capY}
            x2={end.x + capX}
            y2={end.y - capY}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          {!!label && (
            <G>
              <Rect
                x={midX - (label.length * CALLOUT_FONT * 0.32 + 8)}
                y={midY - CALLOUT_FONT - 6}
                width={label.length * CALLOUT_FONT * 0.64 + 16}
                height={CALLOUT_FONT + 10}
                rx={4}
                fill="rgba(0,0,0,0.65)"
              />
              <SvgText
                x={midX}
                y={midY - 2}
                fill={color}
                fontSize={CALLOUT_FONT}
                fontWeight="bold"
                textAnchor="middle"
              >
                {label}
              </SvgText>
            </G>
          )}
        </G>
      );
    }

    case 'FREEHAND':
      return (
        <Polyline
          points={scaled.map(p => `${p.x},${p.y}`).join(' ')}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );

    case 'TEXT': {
      if (!label) return null;
      const boxWidth = label.length * CALLOUT_FONT * 0.62 + 18;
      const boxHeight = CALLOUT_FONT + 14;
      const x = Math.min(Math.max(start.x, 4), Math.max(4, width - boxWidth - 4));
      const y = Math.min(Math.max(start.y, 4), Math.max(4, height - boxHeight - 4));
      return (
        <G>
          <Rect x={x} y={y} width={boxWidth} height={boxHeight} rx={6} fill="rgba(0,0,0,0.72)" stroke={color} strokeWidth={2} />
          <SvgText x={x + 9} y={y + CALLOUT_FONT + 3} fill={color} fontSize={CALLOUT_FONT} fontWeight="600">
            {label}
          </SvgText>
        </G>
      );
    }

    default:
      return null;
  }
};

/**
 * Touch canvas overlay for vector damage markup (Requirement 4.2 - Interactive Annotation Tools).
 * Coordinates are stored normalised so the same annotation renders correctly over a
 * thumbnail, the editor, and the flattened full-resolution export.
 */
export const AnnotationCanvas: React.FC<Props> = ({
  width,
  height,
  annotations,
  readOnly = false,
  tool = 'ARROW',
  color = '#ef4444',
  strokeWidth = 4,
  onDraft,
}) => {
  const [draft, setDraft] = useState<Annotation | null>(null);
  // PanResponder closes over its callbacks once, so live tool settings are read via refs.
  const settings = useRef({ tool, color, strokeWidth, width, height, onDraft });
  settings.current = { tool, color, strokeWidth, width, height, onDraft };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          const { locationX, locationY } = evt.nativeEvent;
          const s = settings.current;
          const point = toNormalized(locationX, locationY, s.width, s.height);
          setDraft({
            id: createAnnotationId(),
            tool: s.tool,
            color: s.color,
            strokeWidth: s.strokeWidth,
            points: [point, point],
            createdAt: new Date().toISOString(),
          });
        },
        onPanResponderMove: evt => {
          const { locationX, locationY } = evt.nativeEvent;
          const s = settings.current;
          const point = toNormalized(locationX, locationY, s.width, s.height);
          setDraft(current => {
            if (!current) return current;
            if (current.tool === 'TEXT') return current;
            if (isTwoPointTool(current.tool)) {
              return { ...current, points: [current.points[0], point] };
            }
            return { ...current, points: [...current.points, point] };
          });
        },
        onPanResponderRelease: () => {
          setDraft(current => {
            if (current) {
              const s = settings.current;
              // A tap with a drag tool would otherwise commit a zero-length shape.
              const [first, last] = [current.points[0], current.points[current.points.length - 1]];
              const dragged = Math.hypot(last.x - first.x, last.y - first.y) > 0.01;
              if (current.tool === 'TEXT' || dragged) {
                s.onDraft?.(current);
              }
            }
            return null;
          });
        },
        onPanResponderTerminate: () => setDraft(null),
      }),
    []
  );

  const handlers = readOnly ? {} : panResponder.panHandlers;
  // A TEXT draft has no label yet, so it renders as a placement marker instead of a box.
  const showDraftMarker = draft?.tool === 'TEXT';

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} {...handlers} pointerEvents={readOnly ? 'none' : 'auto'}>
      <Svg width={width} height={height}>
        {annotations.map(a => (
          <AnnotationShape key={a.id} annotation={a} width={width} height={height} />
        ))}
        {draft && !showDraftMarker && <AnnotationShape annotation={draft} width={width} height={height} />}
        {draft && showDraftMarker && (
          <Ellipse
            cx={clamp01(draft.points[0].x) * width}
            cy={clamp01(draft.points[0].y) * height}
            rx={6}
            ry={6}
            fill={draft.color}
          />
        )}
      </Svg>
    </View>
  );
};

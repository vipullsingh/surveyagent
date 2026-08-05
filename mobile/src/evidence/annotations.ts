import { Annotation, AnnotationPoint, AnnotationTool } from '../types';

export const ANNOTATION_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ffffff', '#111827'];

export const ANNOTATION_TOOLS: { tool: AnnotationTool; icon: string; label: string }[] = [
  { tool: 'ARROW', icon: '↗', label: 'Arrow' },
  { tool: 'CIRCLE', icon: '◯', label: 'Circle' },
  { tool: 'RECT', icon: '▭', label: 'Box' },
  { tool: 'MEASURE', icon: '↔', label: 'Measure' },
  { tool: 'FREEHAND', icon: '✎', label: 'Draw' },
  { tool: 'TEXT', icon: 'T', label: 'Callout' },
];

/** Tools defined by a drag from start to end; everything else collects a path. */
const TWO_POINT_TOOLS: AnnotationTool[] = ['ARROW', 'CIRCLE', 'RECT', 'MEASURE'];

export const isTwoPointTool = (tool: AnnotationTool): boolean => TWO_POINT_TOOLS.includes(tool);

export const parseAnnotations = (raw?: string): Annotation[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Annotation[]) : [];
  } catch {
    return [];
  }
};

export const serializeAnnotations = (annotations: Annotation[]): string | undefined =>
  annotations.length > 0 ? JSON.stringify(annotations) : undefined;

export const createAnnotationId = (): string =>
  `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const toNormalized = (x: number, y: number, width: number, height: number): AnnotationPoint => ({
  x: clamp01(width > 0 ? x / width : 0),
  y: clamp01(height > 0 ? y / height : 0),
});

/**
 * Straight-line distance between two normalised points, expressed as a fraction of the
 * image diagonal. The MEASURE tool pairs this with a surveyor-supplied real-world value.
 */
export const normalizedLength = (a: AnnotationPoint, b: AnnotationPoint): number =>
  Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

export const describeTool = (tool: AnnotationTool): string =>
  ANNOTATION_TOOLS.find(t => t.tool === tool)?.label ?? tool;

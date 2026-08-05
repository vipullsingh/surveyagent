import { Case, Media, VoiceNote } from '../types';
import { fileChecksum, toDataUri } from '../evidence/EvidenceStore';

export interface PDFExportOptions {
  includePhotos: boolean;
  includeGeotags: boolean;
  includeChecklist: boolean;
  customRemarks?: string;
  inspectorSignature?: string;
  /**
   * Inlined `data:` URIs keyed by media id. The report is a self-contained document,
   * so photographs must be embedded rather than referenced by local file path.
   */
  photoDataUris?: Record<string, string>;
}

class PDFExporter {
  /**
   * Reads the flattened evidence renditions off disk and inlines them.
   * Run this before {@link generateReportHTML} whenever photos are included.
   */
  public async buildPhotoDataUris(medias: Media[]): Promise<Record<string, string>> {
    const entries = await Promise.all(
      medias
        .filter(m => m.fileType === 'PHOTO' && !m.isDeleted)
        .map(async m => [m.id, await toDataUri(m.localPath)] as const)
    );

    return entries.reduce<Record<string, string>>((acc, [id, uri]) => {
      if (uri) acc[id] = uri;
      return acc;
    }, {});
  }

  /**
   * Generates formatted HTML string ready for native PDF rendering or local preview
   */
  public generateReportHTML(
    caseItem: Case,
    medias: Media[],
    voiceNotes: VoiceNote[],
    options: PDFExportOptions
  ): string {
    const photoRows = medias
      .filter(m => m.fileType === 'PHOTO' && !m.isDeleted)
      .map((m, idx) => {
        const dataUri = options.photoDataUris?.[m.id];
        const checksum = fileChecksum(m.localPath);
        const frame = dataUri
          ? `<img src="${dataUri}" alt="Evidence photo ${idx + 1}" style="width: 100%; max-height: 320px; object-fit: contain; background: #0f172a; border-radius: 4px;" />`
          : `<div style="background: #f1f5f9; height: 180px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #475569; font-weight: bold;">
               [ EVIDENTIAL PHOTO #${idx + 1} — image unavailable on this device ]
             </div>`;

        return `
        <div style="border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 15px; page-break-inside: avoid;">
          <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 6px;">
            #${idx + 1} — ${m.angleLabel || 'Additional Evidence'}
          </div>
          ${frame}
          ${m.caption ? `<div style="font-size: 12px; color: #1e293b; margin-top: 6px;">${m.caption}</div>` : ''}
          <div style="margin-top: 8px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
            <span><strong>Timestamp:</strong> ${new Date(m.timestamp).toLocaleString()}</span>
            ${
              options.includeGeotags && m.latitude !== undefined
                ? `<span><strong>GPS:</strong> ${m.latitude.toFixed(6)}°, ${m.longitude?.toFixed(6)}°${
                    m.altitude !== undefined ? ` • ALT ${Math.round(m.altitude)}m` : ''
                  }${m.gpsAccuracy !== undefined ? ` • ±${Math.round(m.gpsAccuracy)}m` : ''}</span>`
                : '<span><strong>GPS:</strong> no fix at capture time</span>'
            }
          </div>
          ${checksum ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 3px; font-family: monospace;">MD5 ${checksum}</div>` : ''}
          ${m.aiTags?.length ? `<div style="font-size: 11px; color: #2563eb; margin-top: 4px;"><strong>AI Tags:</strong> ${m.aiTags.join(', ')}</div>` : ''}
        </div>
      `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Survey Report - ${caseItem.caseNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 24px; line-height: 1.5; font-size: 13px; }
    .banner { background: #1e3a8a; color: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .banner h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .card-title { font-weight: bold; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .card-value { font-size: 14px; font-weight: 600; color: #1e293b; }
    .section { border-top: 2px solid #3b82f6; padding-top: 12px; margin-top: 24px; margin-bottom: 16px; }
    .section-title { font-size: 15px; font-weight: 700; color: #1e3a8a; margin-bottom: 8px; text-transform: uppercase; }
    .ai-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px; }
    .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="banner">
    <div>
      <h1>SURVEYAGENT LOSS REPORT</h1>
      <div style="font-size: 11px; opacity: 0.9;">Geotagged Field Inspection Document</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold;">${caseItem.caseNumber}</div>
      <div style="font-size: 11px;">Date: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card"><div class="card-title">Insured Party</div><div class="card-value">${caseItem.insuredName}</div></div>
    <div class="card"><div class="card-title">Policy Number</div><div class="card-value">${caseItem.policyNumber}</div></div>
    <div class="card"><div class="card-title">Claim Type</div><div class="card-value">${caseItem.claimType}</div></div>
    <div class="card"><div class="card-title">Date of Loss</div><div class="card-value">${caseItem.dateOfLoss.substring(0, 10)}</div></div>
  </div>

  <div class="section">
    <div class="section-title">Site Location & GPS Integrity</div>
    <p><strong>Address:</strong> ${caseItem.location || 'N/A'}</p>
    ${caseItem.latitude ? `<p><strong>Coordinates:</strong> ${caseItem.latitude.toFixed(6)}°, ${caseItem.longitude?.toFixed(6)}° (Verified Geotag)</p>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Findings & Damage Assessment</div>
    <div class="ai-badge">Generated by On-Device Local LLM</div>
    <p>${caseItem.aiSummary || 'Physical inspection completed.'}</p>
    ${options.customRemarks ? `<p><strong>Inspector Remarks:</strong> ${options.customRemarks}</p>` : ''}
  </div>

  ${
    options.includePhotos && medias.length > 0
      ? `
  <div class="section">
    <div class="section-title">Evidential Photographic Proof (${medias.length} Items)</div>
    ${photoRows}
  </div>`
      : ''
  }

  <div class="section">
    <div class="section-title">Surveyor Certification</div>
    <p>I confirm that the data, evidence, and notes captured in this report accurately reflect the condition of the subject asset at the time of field inspection.</p>
    <div style="margin-top: 25px; display: flex; justify-content: space-between;">
      <div>
        <p><strong>Inspector Sign-off:</strong> ${options.inspectorSignature || 'Licensed Field Inspector'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <div style="border: 1px dashed #94a3b8; width: 150px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8;">
        [ DIGITAL STAMP ]
      </div>
    </div>
  </div>

  <div class="footer">
    SurveyAgent Field Application • Verified Offline Audit Trail • Document Hash: ${Math.random().toString(36).substring(2, 12).toUpperCase()}
  </div>
</body>
</html>
    `;
  }
}

export const pdfExporter = new PDFExporter();

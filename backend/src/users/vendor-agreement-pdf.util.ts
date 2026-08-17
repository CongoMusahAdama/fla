import PDFDocument from 'pdfkit';

export type AgreementLetterPayload = {
  vendor: any;
  generatedAt: string;
  platform: { name: string; legalName: string; website: string };
};

export function buildVendorAgreementPdfBuffer(data: AgreementLetterPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const v = data.vendor || {};
    const shop = v.shopName || v.name || 'Vendor';
    const plan = v.subscriptionLabel || 'Lifetime Partner Plan';
    const price = v.subscriptionPriceText || 'GHS 100 one-time';
    const starts = v.subscriptionStartsAt
      ? new Date(v.subscriptionStartsAt).toLocaleDateString()
      : '—';
    const ends = v.subscriptionEndsAt
      ? new Date(v.subscriptionEndsAt).toLocaleDateString()
      : '—';
    const generated = new Date(data.generatedAt).toLocaleString();

    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text('FLA PURCHASE', { continued: false });
    doc
      .moveDown(0.2)
      .fontSize(20)
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .text('Vendor Partnership Agreement');
    doc
      .moveDown(0.3)
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(data.platform.legalName)
      .text(data.platform.website);

    doc.moveDown(1);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#0f172a')
      .lineWidth(1.5)
      .stroke();

    doc.moveDown(1);
    doc
      .fontSize(11)
      .fillColor('#334155')
      .font('Helvetica')
      .text(
        `This Vendor Partnership Agreement ("Agreement") is entered into as of ${new Date(data.generatedAt).toLocaleDateString()} between ${data.platform.name} ("Platform") and ${shop} ("Vendor"), represented by ${v.name || '—'}.`,
        { align: 'justify', lineGap: 3 },
      );

    const section = (title: string) => {
      doc.moveDown(1.2);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(title);
      doc
        .moveDown(0.3)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.6);
      doc.font('Helvetica').fontSize(10).fillColor('#334155');
    };

    section('1. Parties');
    doc.font('Helvetica-Bold').text('Platform');
    doc.font('Helvetica').text(data.platform.name);
    doc.text(data.platform.legalName);
    doc.text(data.platform.website);
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').text('Vendor');
    doc.font('Helvetica').text(shop);
    doc.text(v.name || '—');
    doc.text(`${v.email || '—'} · ${v.phone || '—'}`);
    doc.text([v.location, v.region].filter(Boolean).join(', ') || '—');
    if (v.uniqueVendorId) doc.text(`Vendor ID: ${v.uniqueVendorId}`);
    if (v.storeSlug) doc.text(`Storefront: /store/${v.storeSlug}`);

    section('2. Subscription plan');
    const rows: Array<[string, string]> = [
      ['Plan', plan],
      ['Type', String(v.subscriptionPlan || 'lifetime').toUpperCase()],
      ['Commercial terms', price],
      ['Start date', starts],
      ['Expiry', ends === '—' ? 'No expiry — lifetime access' : ends],
    ];
    rows.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.font('Helvetica').text(value);
    });

    section('3. Key terms');
    const terms = [
      [
        'Marketplace & storefront.',
        'Vendor may sell through the FLA marketplace and a dedicated storefront URL once identity documents are approved by FLA.',
      ],
      [
        'Onboarding & KYC.',
        'Vendor must upload valid identification and supporting business documents after first login. Product listing is unlocked only after FLA admin approval (typically within 4–5 hours of a complete submission).',
      ],
      [
        'Payments.',
        "Customer payments are processed via FLA's payment provider with an agreed platform split; Vendor payouts settle to the registered MoMo/bank account on file.",
      ],
      [
        'Conduct.',
        'Vendor agrees to fulfil orders accurately, honour stated lead times, and comply with FLA policies, including dispute resolution.',
      ],
      [
        'Credentials.',
        'Vendor will change the temporary password provided at onboarding and keep account access secure.',
      ],
    ];
    terms.forEach(([title, body]) => {
      doc.font('Helvetica-Bold').text(title, { continued: true });
      doc.font('Helvetica').text(` ${body}`, { align: 'justify', lineGap: 2 });
      doc.moveDown(0.5);
    });

    doc.moveDown(1.5);
    const sigY = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
    doc.text('______________________________', 50, sigY);
    doc.text('______________________________', 320, sigY);
    doc.text('FLA authorized signature', 50, sigY + 16);
    doc.text(`Vendor signature — ${shop}`, 320, sigY + 16);
    doc.fillColor('#94a3b8').text('Date: _______________', 50, sigY + 32);
    doc.text('Date: _______________', 320, sigY + 32);

    doc
      .moveDown(3)
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(
        `Generated ${generated} · Confidential partnership document · ${data.platform.name}`,
        50,
        undefined,
        { align: 'center' },
      );

    doc.end();
  });
}

export function agreementPdfFilename(vendor: {
  shopName?: string;
  name?: string;
  _id?: string | { toString(): string };
}) {
  const base = String(vendor.shopName || vendor.name || 'vendor')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `FLA-Vendor-Agreement-${base || 'vendor'}.pdf`;
}

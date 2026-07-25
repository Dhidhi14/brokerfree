import PDFDocument from 'pdfkit';
import type { IPropertyAddress } from '@/models/property.model';
import type { IAgreementTerms } from '@/models/agreement.model';

export interface AgreementPdfParty {
  fullName: string;
  phone: string;
}

export interface AgreementPdfData {
  propertyAddress: IPropertyAddress;
  owner: AgreementPdfParty;
  tenant: AgreementPdfParty;
  terms: IAgreementTerms;
  generatedAt?: Date;
}

const PAGE_MARGIN = 50;
const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatInr(amount: number): string {
  return INR_FORMATTER.format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatAddress(address: IPropertyAddress): string {
  const parts = [
    address.line1,
    address.line2,
    address.locality,
    address.city,
    address.state,
    address.pincode,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return parts.join(', ');
}

/**
 * Builds a formatted rental agreement PDF and returns it as a Buffer.
 */
export function generateAgreementPdf(agreementData: AgreementPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: PAGE_MARGIN,
          bottom: PAGE_MARGIN,
          left: PAGE_MARGIN,
          right: PAGE_MARGIN,
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error: Error) => {
        reject(error);
      });

      const generatedAt = agreementData.generatedAt ?? new Date();
      const pageWidth = doc.page.width - PAGE_MARGIN * 2;

      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .text('RENTAL AGREEMENT', { align: 'center' });

      doc.moveDown(0.4);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#555555')
        .text(`Generated on ${formatDate(generatedAt)}`, { align: 'center' });

      doc.fillColor('#000000');
      doc.moveDown(0.6);
      doc
        .moveTo(PAGE_MARGIN, doc.y)
        .lineTo(PAGE_MARGIN + pageWidth, doc.y)
        .strokeColor('#333333')
        .lineWidth(1)
        .stroke();
      doc.moveDown(1.2);

      doc.font('Helvetica-Bold').fontSize(12).text('1. Property');
      doc.moveDown(0.35);
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(formatAddress(agreementData.propertyAddress), {
          align: 'left',
          lineGap: 2,
        });
      doc.moveDown(1);

      doc.font('Helvetica-Bold').fontSize(12).text('2. Parties');
      doc.moveDown(0.5);

      const partiesTop = doc.y;
      const columnWidth = (pageWidth - 20) / 2;

      doc.font('Helvetica-Bold').fontSize(10).text('Owner (Lessor)', PAGE_MARGIN, partiesTop, {
        width: columnWidth,
      });
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(agreementData.owner.fullName, PAGE_MARGIN, doc.y + 4, {
          width: columnWidth,
        })
        .text(`Phone: ${agreementData.owner.phone}`, {
          width: columnWidth,
        });

      const ownerBottom = doc.y;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Tenant (Lessee)', PAGE_MARGIN + columnWidth + 20, partiesTop, {
          width: columnWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(agreementData.tenant.fullName, PAGE_MARGIN + columnWidth + 20, partiesTop + 16, {
          width: columnWidth,
        })
        .text(`Phone: ${agreementData.tenant.phone}`, {
          width: columnWidth,
        });

      doc.y = Math.max(ownerBottom, doc.y) + 16;

      doc.font('Helvetica-Bold').fontSize(12).text('3. Terms of Tenancy');
      doc.moveDown(0.5);

      const termsRows: Array<[string, string]> = [
        ['Monthly Rent', formatInr(agreementData.terms.rent)],
        ['Security Deposit', formatInr(agreementData.terms.deposit)],
        ['Maintenance Charges', formatInr(agreementData.terms.maintenance)],
        ['Move-in Date', formatDate(new Date(agreementData.terms.moveInDate))],
        [
          'Lease Duration',
          `${agreementData.terms.leaseDurationMonths} months`,
        ],
        [
          'Notice Period',
          `${agreementData.terms.noticePeriodDays} days`,
        ],
      ];

      for (const [label, value] of termsRows) {
        const rowY = doc.y;
        doc.font('Helvetica').fontSize(10).text(label, PAGE_MARGIN, rowY, {
          width: pageWidth * 0.45,
        });
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(value, PAGE_MARGIN + pageWidth * 0.45, rowY, {
            width: pageWidth * 0.55,
            align: 'right',
          });
        doc.moveDown(0.45);
      }

      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(12).text('4. Standard Clauses');
      doc.moveDown(0.45);

      const clauses = [
        'The Tenant shall take reasonable care of the premises, keep them in a clean and habitable condition, and use the property solely for residential purposes. Any damage beyond normal wear and tear shall be repaired at the Tenant\'s expense, or may be deducted from the security deposit upon vacating.',
        'The Tenant agrees to pay the monthly rent and applicable maintenance charges on or before the due date each month. The security deposit shall be held for the duration of the tenancy and returned (subject to lawful deductions) within a reasonable period after vacant possession is handed over.',
        'Either party may terminate this agreement by giving written notice of not less than the notice period stated above. Upon termination, the Tenant shall vacate the premises and return all keys and access devices to the Owner in good condition.',
      ];

      doc.font('Helvetica').fontSize(10);
      for (const [index, clause] of clauses.entries()) {
        doc.text(`${index + 1}. ${clause}`, {
          align: 'justify',
          lineGap: 2,
        });
        doc.moveDown(0.55);
      }

      doc.moveDown(1.2);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#555555')
        .text(
          'By signing digitally in the BrokerFree application, each party confirms they have read and agreed to the terms of this rental agreement.',
          { align: 'left', lineGap: 2 }
        );
      doc.fillColor('#000000');
      doc.moveDown(1.5);

      const signatureTop = doc.y;
      const signatureWidth = columnWidth;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Owner Signature', PAGE_MARGIN, signatureTop, {
          width: signatureWidth,
        });
      doc
        .moveTo(PAGE_MARGIN, signatureTop + 40)
        .lineTo(PAGE_MARGIN + signatureWidth - 10, signatureTop + 40)
        .strokeColor('#000000')
        .lineWidth(0.8)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(agreementData.owner.fullName, PAGE_MARGIN, signatureTop + 48, {
          width: signatureWidth,
        })
        .text('Date: _______________', PAGE_MARGIN, signatureTop + 62, {
          width: signatureWidth,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Tenant Signature', PAGE_MARGIN + columnWidth + 20, signatureTop, {
          width: signatureWidth,
        });
      doc
        .moveTo(PAGE_MARGIN + columnWidth + 20, signatureTop + 40)
        .lineTo(PAGE_MARGIN + pageWidth, signatureTop + 40)
        .stroke();
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(
          agreementData.tenant.fullName,
          PAGE_MARGIN + columnWidth + 20,
          signatureTop + 48,
          { width: signatureWidth }
        )
        .text(
          'Date: _______________',
          PAGE_MARGIN + columnWidth + 20,
          signatureTop + 62,
          { width: signatureWidth }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

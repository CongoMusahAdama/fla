export const FLA_TERMS_VERSION = '2026-06-01';

export type TermsRole = 'customer' | 'vendor';

export function getFlaTermsSections(role: TermsRole) {
  const shared = [
    {
      title: '1. Acceptance',
      body: 'By tapping Agree, you confirm that you have read and accept these Terms and Conditions and our Privacy Policy. If you do not agree, you may not use FLA Purchase.',
    },
    {
      title: '2. Platform role',
      body: 'FLA Purchase is a marketplace that connects customers with independent vendors. FLA facilitates listings, payments through Paystack, order tracking, and dispute support. FLA is not the seller of vendor products unless stated otherwise.',
    },
    {
      title: '3. Payments',
      body: 'Product payments are processed via Paystack. Delivery and logistics fees may be arranged and paid outside the platform between customer and vendor unless clearly shown at checkout. Refunds for disputes are handled according to FLA admin decisions and may require manual processing through Paystack or MoMo where applicable.',
    },
    {
      title: '4. Conduct',
      body: 'You agree not to post false information, harass other users, commit fraud, or misuse the platform. FLA may suspend or terminate accounts that violate these rules.',
    },
    {
      title: '5. Disputes',
      body: 'Order disputes may be raised in the Dispute Center. FLA admin reviews cases and may decide in favour of the customer or vendor. Admin decisions regarding platform records are final for use of FLA services.',
    },
    {
      title: '6. Privacy & data',
      body: 'We collect account, order, and verification data to operate the service. KYC documents for vendors are reviewed for compliance. Contact support@flamingo-store1.com for data questions.',
    },
    {
      title: '7. Limitation of liability',
      body: 'FLA is provided "as is." To the extent permitted by law, FLA is not liable for indirect losses, vendor actions, delivery delays outside our control, or off-platform communications such as WhatsApp between parties.',
    },
    {
      title: '8. Changes',
      body: 'We may update these terms. Continued use after notice constitutes acceptance of the updated version.',
    },
  ];

  const roleSpecific =
    role === 'vendor'
      ? [
          {
            title: 'A. Vendor obligations',
            body: 'You agree to list accurate products, honour paid orders, ship within stated timelines, and respond to customers and FLA admin. You are responsible for product quality, packaging, and compliance with Ghanaian law.',
          },
          {
            title: 'B. Payouts & KYC',
            body: 'Vendor payouts use Paystack subaccounts where configured. You must provide valid KYC and business documents. FLA may withhold or delay activation until verification is complete.',
          },
        ]
      : [
          {
            title: 'A. Customer obligations',
            body: 'You agree to provide accurate delivery details, pay for orders you place, and communicate respectfully with vendors. Confirm receipt when your order arrives or raise a dispute promptly if there is a problem.',
          },
        ];

  return { intro: role === 'vendor' ? 'FLA Vendor Terms' : 'FLA Customer Terms', sections: [...roleSpecific, ...shared] };
}

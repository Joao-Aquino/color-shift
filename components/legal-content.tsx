const EFFECTIVE_DATE = "October 10, 2026";

export function PrivacyPolicyContent() {
  return (
    <>
      <p data-reveal-s>
        Color Shift is built and maintained by João Aquino as an individual developer. This policy explains what data Color Shift collects, how it is used, and your rights.
      </p>

      <section data-reveal-s>
        <h3>Who we are</h3>
        <p>
          Color Shift is developed and operated by João Aquino. For privacy inquiries, contact us at{" "}
          <a href="mailto:joao@co-opstudio.com">joao@co-opstudio.com</a>.
        </p>
      </section>

      <section data-reveal-s>
        <h3>What data we collect</h3>
        <p>
          <strong>We do not collect personal information.</strong> Color Shift does not require accounts, emails, names, or any other personal data to use the app.
        </p>
        <p>
          <strong>Photos you work with.</strong> When you select or upload a photo in Color Shift, the browser creates a local reference to that file on your device. The photo is processed entirely in your browser for color extraction. We do not upload, store, or transmit your photos to our servers.
        </p>
        <p>
          <strong>Theme preference.</strong> Color Shift stores your light or dark theme choice in your browser&rsquo;s local storage so it persists across sessions. This data never leaves your device.
        </p>
        <p>
          <strong>Motion settings in development builds.</strong> Color Shift may store animation timing preferences locally for debugging. These settings never leave your device and are not present in production builds.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Third-party services</h3>
        <p>
          <strong>Unsplash.</strong> Color Shift makes server-side requests to the Unsplash API to fetch photos and does not add names, email addresses, account IDs, or other profile data to those requests. Unsplash images are hosted by Unsplash and load directly in your browser, so Unsplash may receive standard request information such as your IP address and browser details. When you copy or download a color pair that uses an Unsplash photo, Color Shift sends a server-side request to Unsplash&rsquo;s download tracking endpoint, as required by its API guidelines, so the photographer receives proper credit. Read the{" "}
          <a href="https://unsplash.com/privacy" rel="noreferrer" target="_blank">Unsplash Privacy Policy</a>.
        </p>
        <p>
          <strong>Vercel.</strong> Color Shift is hosted on Vercel. Vercel may process standard infrastructure data such as IP addresses, browser types, request times, and response codes while delivering the service. Read the{" "}
          <a href="https://vercel.com/legal/privacy-notice" rel="noreferrer" target="_blank">Vercel Privacy Notice</a>.
        </p>
        <p>
          <strong>Fonts.</strong> Geist and Geist Mono are bundled with Color Shift and served from the app&rsquo;s own domain. Your browser does not contact Google to load them at runtime.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Future iOS app</h3>
        <ul>
          <li>If you choose a photo from your library, Color Shift will request permission and process the selected photo on your device. It will not be uploaded or transmitted.</li>
          <li>If camera capture is added, the app will request camera permission and process captured photos on your device without uploading them.</li>
          <li>The iOS app is planned without third-party analytics or crash-reporting services. Apple may make crash reports available only when you opt in through iOS settings.</li>
        </ul>
      </section>

      <section data-reveal-s>
        <h3>Cookies</h3>
        <p>Color Shift does not set or use cookies.</p>
      </section>

      <section data-reveal-s>
        <h3>Data storage and security</h3>
        <p>
          The only data Color Shift stores is your theme preference and, in development builds, motion settings. Both stay in local storage on your device. We do not store user accounts, passwords, personal information, color values, specimen text, or uploaded photos on our servers.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Children&rsquo;s privacy</h3>
        <p>
          Color Shift does not knowingly collect personal information from children. The app does not require or request personal information from any user, regardless of age.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Your rights</h3>
        <p>
          Because Color Shift does not collect personal information, there is no personal data held by Color Shift to access, modify, or delete. You can remove your local theme preference by clearing the site data stored by your browser or app.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Changes and contact</h3>
        <p>
          We may update this policy from time to time. When we do, we will update the date at the top of this document. Questions about this policy can be sent to{" "}
          <a href="mailto:joao@co-opstudio.com">joao@co-opstudio.com</a>.
        </p>
      </section>
    </>
  );
}

export function TermsOfServiceContent() {
  return (
    <>
      <p data-reveal-s>
        These terms govern your use of Color Shift. By using the app, you agree to these terms. If you do not agree, please do not use Color Shift.
      </p>

      <section data-reveal-s>
        <h3>The service</h3>
        <p>
          Color Shift is a visual tool for extracting color pairs from photos, editing those colors, evaluating contrast, and exporting the result. The service may change as the product develops.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Using Color Shift</h3>
        <p>You may use Color Shift for lawful personal or commercial work. You agree not to:</p>
        <ul>
          <li>interfere with, overload, reverse engineer, or attempt to gain unauthorized access to the service or its infrastructure;</li>
          <li>use the service to violate another person&rsquo;s rights or any applicable law; or</li>
          <li>misrepresent Color Shift, its output, or third-party content as your own service.</li>
        </ul>
      </section>

      <section data-reveal-s>
        <h3>Your photos and text</h3>
        <p>
          You keep all rights you already have in photos and text you bring to Color Shift. You are responsible for having permission to use that material. User-selected photos and specimen text are processed on your device and are not uploaded to Color Shift&rsquo;s servers.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Third-party photos and services</h3>
        <p>
          Color Shift displays photos supplied by Unsplash and uses Vercel to deliver the web app. Third-party content and services remain subject to their own terms, licenses, and privacy policies. Color Shift does not grant you rights in an Unsplash photo beyond those provided by Unsplash. Photographer and Unsplash attribution must remain intact where it is included in an export.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Color Shift intellectual property</h3>
        <p>
          Color Shift&rsquo;s name, interface, code, and original design remain the property of their respective owner or licensors. These terms give you permission to use the service; they do not transfer ownership of the service itself.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Contrast results</h3>
        <p>
          Contrast scores and suggestions are provided as design aids. Standards, rendering environments, and user needs vary, so you remain responsible for testing your final work and confirming that it meets the accessibility, legal, and technical requirements that apply to your project.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Availability and warranties</h3>
        <p>
          Color Shift is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We do not promise that the service will always be uninterrupted, error-free, or suitable for a particular purpose. To the extent permitted by law, we disclaim implied warranties.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Limitation of liability</h3>
        <p>
          To the extent permitted by law, Color Shift and its operator will not be liable for indirect, incidental, special, consequential, or punitive losses arising from your use of the service, third-party content, or exported results.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Suspension and termination</h3>
        <p>
          We may restrict access to Color Shift when reasonably necessary to protect the service, comply with law, or address misuse. You may stop using the service at any time.
        </p>
      </section>

      <section data-reveal-s>
        <h3>Changes and contact</h3>
        <p>
          We may update these terms from time to time. The date at the top will show the latest version. Questions about these terms can be sent to{" "}
          <a href="mailto:joao@co-opstudio.com">joao@co-opstudio.com</a>.
        </p>
      </section>
    </>
  );
}

export { EFFECTIVE_DATE };

export default function GoogleTag() {
  return (
    <>
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-9FFETKZG8L"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9FFETKZG8L');
          `,
        }}
      />
    </>
  );
}

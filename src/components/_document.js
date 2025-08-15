// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
        {/* This is where modals will be rendered */}
        <div id="modal-root"></div>
      </body>
    </Html>
  )
}
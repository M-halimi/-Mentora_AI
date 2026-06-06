declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  const WorkerMessageHandler: {
    setup: (handler: unknown, port: unknown) => void
  }
  export { WorkerMessageHandler }
}

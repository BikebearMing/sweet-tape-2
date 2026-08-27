import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Traces the server down to just the files it actually imports, so the
     container ships ~300MB instead of the whole node_modules tree — three,
     sharp and Payload's admin bundle make that difference enormous. The
     tradeoff is that the runner stage has to copy .next/static and public in
     by hand; standalone deliberately leaves both out. See the Dockerfile. */
  output: "standalone",

  /* On in dev, where it mounts every component twice. That is exactly the case
     the slider has to survive — initTapeSlider returns a teardown so the second
     mount rebinds rather than doubling every listener and ticker callback. If
     this is ever turned off, that class of bug goes quiet rather than away. */
  reactStrictMode: true,

  // Lets other devices on the LAN (phone previews) hit the dev server's
  // internal assets without Next blocking them as cross-origin. Dev-only
  // by definition; production ignores it.
  allowedDevOrigins: ["192.168.100.127", "192.168.1.16", '192.168.0.36', '192.168.100.127'],

  // Nothing else to configure for the front end — the artwork is served straight
  // from /public and none of it goes through next/image (see TapeSlider).
};



// withPayload wires the admin bundle and Payload's server-only deps into the
// build. It is inert for the front end: pages that never import the config
// never pull Payload in.
export default withPayload(nextConfig);

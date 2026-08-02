import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* On in dev, where it mounts every component twice. That is exactly the case
     the slider has to survive — initTapeSlider returns a teardown so the second
     mount rebinds rather than doubling every listener and ticker callback. If
     this is ever turned off, that class of bug goes quiet rather than away. */
  reactStrictMode: true,

  // Nothing else to configure for the front end — the artwork is served straight
  // from /public and none of it goes through next/image (see TapeSlider).
};

// withPayload wires the admin bundle and Payload's server-only deps into the
// build. It is inert for the front end: pages that never import the config
// never pull Payload in.
export default withPayload(nextConfig);

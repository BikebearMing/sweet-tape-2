/* Payload's admin shell. Generated boilerplate — the only hand-written part is
   the import of the config. Keep it in the (payload) route group so it never
   shares a layout with the site: the admin brings its own <html>, its own CSS
   reset and its own fonts. */
import type { ServerFunctionClient } from "payload";
import type { ReactNode } from "react";

import config from "@payload-config";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import "@payloadcms/next/css";

import { importMap } from "./admin/importMap";

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

export default function PayloadLayout({ children }: { children: ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}

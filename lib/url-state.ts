import { FLOWS, type FlowId, type Oem, type Platform } from "./flows";

/*
 * Everything the prototype shows lives in the URL, so a pitch email can link
 * straight to one moment: /?flow=sensor&step=s-stale&hf=1
 */
export type ViewState = {
  flow: FlowId;
  step: string;
  deny: boolean;
  oem: Oem;
  hf: boolean;
  lv: boolean;
  /** Only used below the two-frame breakpoint. */
  platform: Platform;
};

const OEMS: Oem[] = ["pixel", "samsung", "xiaomi"];

export function parseView(params: URLSearchParams): ViewState {
  const flow: FlowId = params.get("flow") === "sensor" ? "sensor" : "permissions";
  const steps = FLOWS[flow].steps;
  const step = steps.find((s) => s.id === params.get("step"))?.id ?? steps[0].id;
  const oem = OEMS.find((o) => o === params.get("oem")) ?? "pixel";
  return {
    flow,
    step,
    deny: params.get("deny") === "1",
    oem,
    hf: params.get("hf") === "1",
    lv: params.get("lv") === "1",
    platform: params.get("platform") === "ios" ? "ios" : "android",
  };
}

export function serializeView(v: ViewState): string {
  const p = new URLSearchParams();
  p.set("flow", v.flow);
  p.set("step", v.step);
  if (v.deny) p.set("deny", "1");
  if (v.oem !== "pixel") p.set("oem", v.oem);
  if (v.hf) p.set("hf", "1");
  if (v.lv) p.set("lv", "1");
  if (v.platform === "ios") p.set("platform", "ios");
  return `?${p.toString()}`;
}

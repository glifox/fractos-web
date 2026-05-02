import type { FractosView } from "fractos";
import type { Context } from "./handler";

export type Actions = keyof typeof actions;

const actions = {
  NavigateUp: (event: KeyboardEvent, context: Context, view: FractosView) => {
    
  }
} as const;


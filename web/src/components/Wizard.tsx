"use client";

import { useReducer } from "react";
import StepIndicator from "@/components/ui/StepIndicator";
import ErrorMessage from "@/components/ui/ErrorMessage";
import DescribeStep from "@/components/steps/DescribeStep";
import GeneratingStep from "@/components/steps/GeneratingStep";
import ReviewStep from "@/components/steps/ReviewStep";
import RefineStep from "@/components/steps/RefineStep";
import BackgroundStep from "@/components/steps/BackgroundStep";
import ExportStep from "@/components/steps/ExportStep";
import type { WizardState, WizardAction } from "@/lib/types";

const initialState: WizardState = {
  step: "describe",
  description: "",
  iconBase64: null,
  editMessage: "",
  backgroundConfig: { type: "auto" },
  assets: null,
  expoConfig: null,
  backgroundColor: null,
  error: null,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_DESCRIPTION":
      return { ...state, description: action.description };
    case "UPLOAD_ICON":
      return { ...state, iconBase64: action.iconBase64, step: "review", editMessage: "" };
    case "UPLOAD_LOGO":
      return { ...state, iconBase64: action.iconBase64, step: "background", editMessage: "" };
    case "GENERATE_START":
      return { ...state, step: "generating", error: null };
    case "GENERATE_SUCCESS":
      return { ...state, iconBase64: action.iconBase64, step: "review", editMessage: "" };
    case "GENERATE_ERROR":
      return { ...state, step: "describe", error: action.error };
    case "ACCEPT_ICON":
      return { ...state, step: "background" };
    case "REQUEST_REFINE":
      return { ...state, step: "refining" };
    case "REFINE_START":
      return state; // stay on refining step, loading handled by component
    case "REFINE_SUCCESS":
      return { ...state, iconBase64: action.iconBase64, editMessage: action.message, step: "review" };
    case "REFINE_ERROR":
      return { ...state, step: "refining", error: action.error };
    case "SET_BACKGROUND":
      return { ...state, backgroundConfig: action.config };
    case "EXPORT_START":
      return { ...state, step: "exporting", assets: null };
    case "EXPORT_SUCCESS":
      return { ...state, assets: action.assets, expoConfig: action.expoConfig, backgroundColor: action.backgroundColor, step: "export" };
    case "EXPORT_ERROR":
      return { ...state, step: "background", error: action.error };
    case "START_OVER":
      return { ...initialState };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

export default function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepIndicator current={state.step} />

      {state.error && (
        <div className="mb-6">
          <ErrorMessage
            message={state.error}
            onDismiss={() => dispatch({ type: "CLEAR_ERROR" })}
          />
        </div>
      )}

      {state.step === "describe" && <DescribeStep dispatch={dispatch} />}

      {state.step === "generating" && (
        <GeneratingStep description={state.description} dispatch={dispatch} />
      )}

      {state.step === "review" && state.iconBase64 && (
        <ReviewStep
          iconBase64={state.iconBase64}
          editMessage={state.editMessage}
          dispatch={dispatch}
        />
      )}

      {state.step === "refining" && state.iconBase64 && (
        <RefineStep iconBase64={state.iconBase64} dispatch={dispatch} />
      )}

      {state.step === "background" && state.iconBase64 && (
        <BackgroundStep iconBase64={state.iconBase64} dispatch={dispatch} />
      )}

      {(state.step === "exporting" || state.step === "export") &&
        state.iconBase64 && (
          <ExportStep
            iconBase64={state.iconBase64}
            backgroundConfig={state.backgroundConfig}
            assets={state.assets}
            expoConfig={state.expoConfig}
            backgroundColor={state.backgroundColor}
            dispatch={dispatch}
          />
        )}
    </div>
  );
}

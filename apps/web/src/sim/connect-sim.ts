export type SegmentId = "recruiter" | "client" | "student";

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  // Recruiter fields
  company?: string;
  role?: string;
  // Client fields
  projectType?: string;
  timeline?: string;
  // Student fields
  stage?: string;
  topic?: string;
}

export interface ConnectSimState {
  segment: SegmentId;
  formData: ContactFormData;
  submitting: boolean;
  submitted: boolean;
  errors: Record<string, string>;
}

export type ConnectSimEvent =
  | { type: "SET_SEGMENT"; segment: SegmentId }
  | { type: "UPDATE_FIELD"; field: keyof ContactFormData; value: string }
  | { type: "START_SUBMIT" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "RESET_FORM" };

export const initialConnectSimState: ConnectSimState = {
  segment: "recruiter",
  formData: {
    name: "",
    email: "",
    message: "",
    company: "",
    role: "",
    projectType: "Full app (web or mobile)",
    timeline: "1–3 months",
    stage: "Student",
    topic: "Just saying hi",
  },
  submitting: false,
  submitted: false,
  errors: {},
};

export function connectSimReducer(
  state: ConnectSimState,
  event: ConnectSimEvent
): ConnectSimState {
  switch (event.type) {
    case "SET_SEGMENT":
      return {
        ...state,
        segment: event.segment,
        errors: {},
      };

    case "UPDATE_FIELD":
      return {
        ...state,
        formData: {
          ...state.formData,
          [event.field]: event.value,
        },
        errors: {
          ...state.errors,
          [event.field]: "",
        },
      };

    case "START_SUBMIT": {
      const errors: Record<string, string> = {};
      if (!state.formData.name.trim()) errors.name = "Name is required";
      if (!state.formData.email.trim() || !state.formData.email.includes("@")) {
        errors.email = "Valid email is required";
      }
      if (!state.formData.message.trim()) errors.message = "Message is required";

      if (Object.keys(errors).length > 0) {
        return {
          ...state,
          errors,
          submitting: false,
        };
      }

      return {
        ...state,
        submitting: true,
        errors: {},
      };
    }

    case "SUBMIT_SUCCESS":
      return {
        ...state,
        submitting: false,
        submitted: true,
      };

    case "RESET_FORM":
      return {
        ...initialConnectSimState,
        segment: state.segment,
      };

    default:
      return state;
  }
}

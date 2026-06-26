import type {
  RegistrationResponse,
  ReplaceRegistrationInput,
} from "../types/registration";
import { apiRequest } from "./client";

export function getRegistration(slug: string): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>(
    `/tournaments/${encodeURIComponent(slug)}/registration`,
  );
}

export function saveRegistration(
  slug: string,
  input: ReplaceRegistrationInput,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>(
    `/tournaments/${encodeURIComponent(slug)}/registration`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}
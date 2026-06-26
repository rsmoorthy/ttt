import { z } from "zod";

export const createScheduleSchema = z.object({
  numSlots: z
    .number()
    .int()
    .positive("numSlots must be greater than 0"),
  numTables: z
    .number()
    .int()
    .positive("numTables must be greater than 0"),
  maxMatchesPerSlot: z
    .number()
    .int()
    .positive("maxMatchesPerSlot must be greater than 0"),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  pvLeaderboard: defineTable({
    name: v.string(),
    correctDimensions: v.number(),
    totalDimensions: v.number(),
    casesReviewed: v.number(),
    pct: v.number(),
  }).index("by_pct", ["pct"]),
  pvSyncProfiles: defineTable({
    code: v.string(),
    historyJson: v.string(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),
})

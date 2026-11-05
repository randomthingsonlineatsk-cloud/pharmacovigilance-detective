import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const MAX_NAME_LENGTH = 24
const LEADERBOARD_SIZE = 20
const MIN_CASES = 5

const entryValidator = v.object({
  _id: v.id("pvLeaderboard"),
  _creationTime: v.number(),
  name: v.string(),
  correctDimensions: v.number(),
  totalDimensions: v.number(),
  casesReviewed: v.number(),
  pct: v.number(),
})

export const top = query({
  args: {},
  returns: v.array(entryValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("pvLeaderboard")
      .withIndex("by_pct")
      .order("desc")
      .take(LEADERBOARD_SIZE)
  },
})

export const submit = mutation({
  args: { name: v.string(), correctDimensions: v.number(), totalDimensions: v.number(), casesReviewed: v.number() },
  returns: v.id("pvLeaderboard"),
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, MAX_NAME_LENGTH)
    if (!name) throw new Error("Name is required")
    if (args.correctDimensions < 0 || args.correctDimensions > args.totalDimensions) throw new Error("Invalid score")
    if (args.casesReviewed < MIN_CASES) throw new Error(`At least ${MIN_CASES} cases required before submitting`)
    const pct = (args.correctDimensions / args.totalDimensions) * 100
    return await ctx.db.insert("pvLeaderboard", { name, correctDimensions: args.correctDimensions, totalDimensions: args.totalDimensions, casesReviewed: args.casesReviewed, pct })
  },
})

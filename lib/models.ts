import mongoose, { Schema } from "mongoose";

const models = mongoose.models;

export interface UserRecord {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "member" | "super_admin" | "admin" | "content_editor" | "event_manager" | "election_manager" | "shop_manager" | "finance_manager";
  emailVerified: boolean;
  phoneVerified: boolean;
  voterId?: string;
  status: "active" | "suspended";
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
}

export const UserModel = models.User ?? mongoose.model("User", new Schema<UserRecord>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "member" },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  voterId: { type: String, unique: true, sparse: true },
  status: { type: String, default: "active" },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true }));

const ElectionSchema = new Schema({
  title: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  status: { type: String, enum: ["draft", "registration", "open", "closed", "certified"], default: "registration" },
  certified: { type: Boolean, default: false },
  totalValidVotes: { type: Number, default: 0 },
}, { timestamps: true });

export const ElectionModel = models.Election ?? mongoose.model("Election", ElectionSchema);

const CandidateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  candidateId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  biography: { type: String, default: "" },
  campaignStatement: { type: String, default: "" },
  location: { type: String, default: "" },
  photograph: { type: String, default: "" },
  status: { type: String, enum: ["draft", "submitted", "under_review", "approved", "rejected", "withdrawn"], default: "draft" },
  electionIds: [{ type: Schema.Types.ObjectId, ref: "Election" }],
}, { timestamps: true });

export const CandidateModel = models.Candidate ?? mongoose.model("Candidate", CandidateSchema);

const VoteSchema = new Schema({
  electionId: { type: Schema.Types.ObjectId, ref: "Election", required: true },
  voterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
  validityStatus: { type: String, enum: ["valid", "invalid"], default: "valid" },
  auditReference: { type: String, required: true },
}, { timestamps: true });
VoteSchema.index({ electionId: 1, voterId: 1 }, { unique: true });

export const VoteModel = models.Vote ?? mongoose.model("Vote", VoteSchema);

const ContentSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: String,
  excerpt: String,
  body: { type: String, default: "" },
  image: String,
  status: { type: String, enum: ["draft", "pending_review", "approved", "scheduled", "published", "archived"], default: "draft" },
  publishedAt: Date,
  featured: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const ContentModel = models.Content ?? mongoose.model("Content", ContentSchema);

export const ChallengeRegistrationSchema = new Schema({
  challengeSlug: { type: String, required: true, index: true },
  fullName: { type: String, required: true, trim: true },
  stageName: { type: String, trim: true, default: "" },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  category: { type: String, enum: ["music", "dance", "film", "fashion", "comedy", "content"], required: true },
  entryTitle: { type: String, required: true, trim: true },
  entryLink: { type: String, default: "" },
  photograph: { type: String, default: "" },
  status: { type: String, enum: ["registered", "review", "approved", "rejected"], default: "registered", index: true },
  voterId: { type: String, default: "" },
}, { timestamps: true });
ChallengeRegistrationSchema.index({ challengeSlug: 1, email: 1 }, { unique: true });
ChallengeRegistrationSchema.index({ challengeSlug: 1, status: 1, voterId: 1 });

export const ChallengeRegistrationModel = models.ChallengeRegistration ?? mongoose.model("ChallengeRegistration", ChallengeRegistrationSchema);

const ChallengeVoteSchema = new Schema({
  challengeSlug: { type: String, required: true, index: true },
  contestantId: { type: Schema.Types.ObjectId, ref: "ChallengeRegistration", required: true },
  voterId: { type: String, required: true },
  auditReference: { type: String, required: true },
}, { timestamps: true });
ChallengeVoteSchema.index({ challengeSlug: 1, voterId: 1 }, { unique: true });
ChallengeVoteSchema.index({ challengeSlug: 1, contestantId: 1 });

export const ChallengeVoteModel = models.ChallengeVote ?? mongoose.model("ChallengeVote", ChallengeVoteSchema);

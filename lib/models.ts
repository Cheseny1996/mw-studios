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

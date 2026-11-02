import mongoose, { Schema } from "mongoose";
import { STAFF_DEPARTMENTS, STAFF_ROLES, type StaffDepartment, type StaffRole } from "@/lib/staff-roles";

const models = mongoose.models;

export interface UserRecord {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "member" | StaffRole;
  department?: StaffDepartment;
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
  role: { type: String, enum: ["member", ...STAFF_ROLES], default: "member" },
  department: { type: String, enum: STAFF_DEPARTMENTS, default: "other" },
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

const StudioEventSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  excerpt: { type: String, default: "" },
  description: { type: String, default: "" },
  date: { type: Date, required: true },
  endDate: Date,
  time: { type: String, default: "" },
  location: { type: String, default: "" },
  image: { type: String, default: "" },
  status: { type: String, enum: ["draft", "published", "cancelled", "archived"], default: "draft" },
  capacity: { type: Number, default: 0 },
  registrationCount: { type: Number, default: 0 },
}, { timestamps: true });

export const StudioEventModel = models.StudioEvent ?? mongoose.model("StudioEvent", StudioEventSchema);

const OpportunitySchema = new Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  department: { type: String, enum: ["hr", "creative", "production", "communications", "events", "technology", "other"], default: "other" },
  location: { type: String, default: "Nairobi, Kenya" },
  employmentType: { type: String, default: "Full-time" },
  summary: { type: String, default: "" },
  description: { type: String, default: "" },
  requirements: { type: String, default: "" },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  applicationEmail: { type: String, default: "careers@mzimawellsstudios.com" },
  applicationUrl: { type: String, default: "" },
}, { timestamps: true });

export const OpportunityModel = models.Opportunity ?? mongoose.model("Opportunity", OpportunitySchema);

const EventRegistrationSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: "StudioEvent", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["registered", "cancelled", "attended"], default: "registered" },
}, { timestamps: true });
EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventRegistrationModel = models.EventRegistration ?? mongoose.model("EventRegistration", EventRegistrationSchema);

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

const ChallengeSettingsSchema = new Schema({
  challengeSlug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  challengeType: { type: String, enum: ["tshirt", "seasonal", "game_night", "creative", "custom"], default: "creative" },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  published: { type: Boolean, default: true, index: true },
  registrationStartsAt: { type: Date, required: true },
  registrationEndsAt: { type: Date, required: true },
  votingStartsAt: { type: Date, required: true },
  votingEndsAt: { type: Date, required: true },
  nextAnnouncement: { type: String, default: "" },
  prizeSummary: { type: String, default: "" },
}, { timestamps: true });

export const ChallengeSettingsModel = models.ChallengeSettings ?? mongoose.model("ChallengeSettings", ChallengeSettingsSchema);

const CommunityPollSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: "", trim: true, maxlength: 1000 },
  options: { type: [String], required: true, validate: (values: string[]) => values.length >= 2 && values.length <= 8 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ["draft", "active", "closed"], default: "draft", index: true },
}, { timestamps: true });

export const CommunityPollModel = models.CommunityPoll ?? mongoose.model("CommunityPoll", CommunityPollSchema);

const CommunityPollVoteSchema = new Schema({
  pollId: { type: Schema.Types.ObjectId, ref: "CommunityPoll", required: true },
  voterId: { type: String, required: true },
  optionIndex: { type: Number, required: true },
}, { timestamps: true });
CommunityPollVoteSchema.index({ pollId: 1, voterId: 1 }, { unique: true });
CommunityPollVoteSchema.index({ pollId: 1, optionIndex: 1 });

export const CommunityPollVoteModel = models.CommunityPollVote ?? mongoose.model("CommunityPollVote", CommunityPollVoteSchema);

const ShopCategorySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: "", trim: true, maxlength: 500 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const ShopCategoryModel = models.ShopCategory ?? mongoose.model("ShopCategory", ShopCategorySchema);

const ShopProductSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  imageUrl: { type: String, default: "", trim: true, maxlength: 2048 },
  price: { type: Number, required: true, min: 0 },
  categorySlug: { type: String, required: true, index: true },
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
}, { timestamps: true });

export const ShopProductModel = models.ShopProduct ?? mongoose.model("ShopProduct", ShopProductSchema);

const ShopOrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true, maxlength: 32 },
  deliveryMethod: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
  deliveryAddress: { type: String, default: "", trim: true, maxlength: 1000 },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "ShopProduct", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  }],
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["mpesa"], default: "mpesa" },
  paymentStatus: { type: String, enum: ["initiating", "pending", "paid", "failed"], default: "initiating", index: true },
  mpesaCheckoutRequestId: { type: String, default: "", index: true },
  mpesaMerchantRequestId: { type: String, default: "" },
  mpesaReceiptNumber: { type: String, default: "" },
  paymentResult: { type: String, default: "", maxlength: 500 },
  status: { type: String, enum: ["pending", "confirmed", "fulfilled", "cancelled"], default: "pending", index: true },
}, { timestamps: true });

export const ShopOrderModel = models.ShopOrder ?? mongoose.model("ShopOrder", ShopOrderSchema);

import * as lib from "./lib"

// Profile queries
export async function createProfile(
  userId: string,
  data: {
    name: string
    description: string
    system_prompt: string
    avatar_url?: string
  },
) {
  const profileId = lib.nanoid(12)

  const [newProfile] = await lib.db
    .insert(lib.Schema.Ai.Profile.table)
    .values({
      id: profileId,
      user_id: userId,
      name: data.name,
      description: data.description,
      system_prompt: data.system_prompt,
      avatar_url: data.avatar_url,
    })
    .returning()

  return newProfile
}

export async function getProfilesByUser(userId: string) {
  return await lib.db
    .select()
    .from(lib.Schema.Ai.Profile.table)
    .where(lib.and(lib.eq(lib.Schema.Ai.Profile.table.user_id, userId), lib.isNull(lib.Schema.Ai.Profile.table.deleted_at), lib.eq(lib.Schema.Ai.Profile.table.is_active, true)))
    .orderBy(lib.desc(lib.Schema.Ai.Profile.table.created_at))
}

export async function getProfile(profileId: string, userId: string) {
  const [profile] = await lib.db
    .select()
    .from(lib.Schema.Ai.Profile.table)
    .where(lib.and(lib.eq(lib.Schema.Ai.Profile.table.id, profileId), lib.eq(lib.Schema.Ai.Profile.table.user_id, userId), lib.isNull(lib.Schema.Ai.Profile.table.deleted_at)))

  return profile || null
}

export async function updateProfile(
  profileId: string,
  userId: string,
  data: Partial<{
    name: string
    description: string
    system_prompt: string
    avatar_url: string
    is_active: boolean
  }>,
) {
  const [updatedProfile] = await lib.db
    .update(lib.Schema.Ai.Profile.table)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(lib.and(lib.eq(lib.Schema.Ai.Profile.table.id, profileId), lib.eq(lib.Schema.Ai.Profile.table.user_id, userId), lib.isNull(lib.Schema.Ai.Profile.table.deleted_at)))
    .returning()

  return updatedProfile || null
}

export async function deleteProfile(profileId: string, userId: string) {
  const [deletedProfile] = await lib.db
    .update(lib.Schema.Ai.Profile.table)
    .set({
      deleted_at: new Date(),
      is_active: false,
    })
    .where(lib.and(lib.eq(lib.Schema.Ai.Profile.table.id, profileId), lib.eq(lib.Schema.Ai.Profile.table.user_id, userId), lib.isNull(lib.Schema.Ai.Profile.table.deleted_at)))
    .returning()

  return !!deletedProfile
}

// Conversation queries
export async function createConversation(userId: string, profileId: string, title?: string) {
  const conversationId = lib.nanoid(12)

  const [newConversation] = await lib.db
    .insert(lib.Schema.Ai.Conversation.table)
    .values({
      id: conversationId,
      user_id: userId,
      profile_id: profileId,
      title: title || "New Conversation",
    })
    .returning()

  return newConversation
}

export async function getConversationsByProfile(profileId: string, userId: string) {
  return await lib.db
    .select()
    .from(lib.Schema.Ai.Conversation.table)
    .where(
      lib.and(
        lib.eq(lib.Schema.Ai.Conversation.table.profile_id, profileId),
        lib.eq(lib.Schema.Ai.Conversation.table.user_id, userId),
        lib.isNull(lib.Schema.Ai.Conversation.table.deleted_at),
        lib.eq(lib.Schema.Ai.Conversation.table.is_archived, false),
      ),
    )
    .orderBy(lib.desc(lib.Schema.Ai.Conversation.table.updated_at))
}

export async function getConversation(conversationId: string, userId: string) {
  const [conv] = await lib.db
    .select()
    .from(lib.Schema.Ai.Conversation.table)
    .where(lib.and(lib.eq(lib.Schema.Ai.Conversation.table.id, conversationId), lib.eq(lib.Schema.Ai.Conversation.table.user_id, userId), lib.isNull(lib.Schema.Ai.Conversation.table.deleted_at)))

  return conv || null
}

export async function deleteConversation(conversationId: string, userId: string) {
  const [deletedConversation] = await lib.db
    .update(lib.Schema.Ai.Conversation.table)
    .set({
      deleted_at: new Date(),
    })
    .where(lib.and(lib.eq(lib.Schema.Ai.Conversation.table.id, conversationId), lib.eq(lib.Schema.Ai.Conversation.table.user_id, userId), lib.isNull(lib.Schema.Ai.Conversation.table.deleted_at)))
    .returning()

  return !!deletedConversation
}

export async function updateConversation(
  conversationId: string,
  userId: string,
  data: { title?: string; is_archived?: boolean }
) {
  const [updatedConversation] = await lib.db
    .update(lib.Schema.Ai.Conversation.table)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(lib.and(lib.eq(lib.Schema.Ai.Conversation.table.id, conversationId), lib.eq(lib.Schema.Ai.Conversation.table.user_id, userId), lib.isNull(lib.Schema.Ai.Conversation.table.deleted_at)))
    .returning()

  return updatedConversation
}

export async function updateConversationTimestamp(conversationId: string) {
  await lib.db
    .update(lib.Schema.Ai.Conversation.table)
    .set({
      updated_at: new Date(),
    })
    .where(lib.eq(lib.Schema.Ai.Conversation.table.id, conversationId))
}

// Message queries
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  tokenCount?: number,
) {
  const messageId = lib.nanoid(12)

  const [newMessage] = await lib.db
    .insert(lib.Schema.Ai.Message.table)
    .values({
      id: messageId,
      conversation_id: conversationId,
      role,
      content,
      token_count: Number(tokenCount) || 0,
    })
    .returning()

  // Update conversation timestamp
  await updateConversationTimestamp(conversationId)

  return newMessage
}

export async function getMessages(conversationId: string, userId: string) {
  // First verify the user owns this conversation
  const conv = await getConversation(conversationId, userId)
  if (!conv) return []

  return await lib.db.select().from(lib.Schema.Ai.Message.table).where(lib.eq(lib.Schema.Ai.Message.table.conversation_id, conversationId)).orderBy(lib.Schema.Ai.Message.table.created_at)
}

export async function clearMessages(conversationId: string, userId: string) {
  // First verify the user owns this conversation
  const conv = await getConversation(conversationId, userId)
  if (!conv) return false

  await lib.db.delete(lib.Schema.Ai.Message.table).where(lib.eq(lib.Schema.Ai.Message.table.conversation_id, conversationId))

  return true
}

// Combined queries
export async function getConversationWithProfile(conversationId: string, userId: string) {
  const [result] = await lib.db
    .select({
      conversation: lib.Schema.Ai.Conversation.table,
      profile: lib.Schema.Ai.Profile.table,
    })
    .from(lib.Schema.Ai.Conversation.table)
    .innerJoin(lib.Schema.Ai.Profile.table, lib.eq(lib.Schema.Ai.Conversation.table.profile_id, lib.Schema.Ai.Profile.table.id))
    .where(
      lib.and(
        lib.eq(lib.Schema.Ai.Conversation.table.id, conversationId),
        lib.eq(lib.Schema.Ai.Conversation.table.user_id, userId),
        lib.isNull(lib.Schema.Ai.Conversation.table.deleted_at),
        lib.isNull(lib.Schema.Ai.Profile.table.deleted_at),
      ),
    )

  return result || null
}

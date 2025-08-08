import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const relationshipsRouter = t.router({
  // ===== PEOPLE =====
  
  // Get user's people
  getUserPeople: protectedProcedure
    .input(z.object({
      userId: z.string(),
      relationshipType: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.relationshipType) {
        where.relationship_type = input.relationshipType;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_people.findMany({
        where,
        orderBy: { importance_level: 'desc' }
      });
    }),

  // Create a person
  createPerson: protectedProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      relationshipType: z.string().optional(),
      role: z.string().optional(),
      importanceLevel: z.number().min(1).max(10).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_people.create({
        data: {
          user_id: input.userId,
          name: input.name,
          relationship_type: input.relationshipType,
          role: input.role,
          importance_level: input.importanceLevel || 5,
          notes: input.notes
        }
      });
    }),

  // Update a person
  updatePerson: protectedProcedure
    .input(z.object({
      personId: z.string(),
      name: z.string().optional(),
      relationshipType: z.string().optional(),
      role: z.string().optional(),
      importanceLevel: z.number().min(1).max(10).optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { personId, ...updateData } = input;
      return await ctx.prisma.user_people.update({
        where: { id: personId },
        data: updateData
      });
    }),

  // Delete a person (soft delete)
  deletePerson: protectedProcedure
    .input(z.object({
      personId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_people.update({
        where: { id: input.personId },
        data: { is_active: false }
      });
    }),

  // ===== RELATIONSHIPS =====
  
  // Get user's relationships
  getUserRelationships: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_relationships.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });
    }),

  // Create a relationship
  createRelationship: protectedProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      role: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_relationships.create({
        data: {
          user_id: input.userId,
          name: input.name,
          role: input.role,
          notes: input.notes
        }
      });
    }),

  // Update a relationship
  updateRelationship: protectedProcedure
    .input(z.object({
      relationshipId: z.string(),
      name: z.string().optional(),
      role: z.string().optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { relationshipId, ...updateData } = input;
      return await ctx.prisma.user_relationships.update({
        where: { id: relationshipId },
        data: updateData
      });
    }),

  // ===== RELATIONSHIP DYNAMICS =====
  
  // Get user's relationship dynamics
  getUserRelationshipDynamics: protectedProcedure
    .input(z.object({
      userId: z.string(),
      relationshipType: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.relationshipType) {
        where.relationship_type = input.relationshipType;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_relationship_dynamics.findMany({
        where,
        orderBy: { emotional_safety_level: 'desc' }
      });
    }),

  // Create relationship dynamic
  createRelationshipDynamic: protectedProcedure
    .input(z.object({
      userId: z.string(),
      relationshipType: z.string(),
      dynamicPattern: z.string().optional(),
      communicationStyle: z.string().optional(),
      conflictResolution: z.string().optional(),
      emotionalSafetyLevel: z.number().min(1).max(10).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_relationship_dynamics.create({
        data: {
          user_id: input.userId,
          relationship_type: input.relationshipType,
          dynamic_pattern: input.dynamicPattern,
          communication_style: input.communicationStyle,
          conflict_resolution: input.conflictResolution,
          emotional_safety_level: input.emotionalSafetyLevel || 5
        }
      });
    }),

  // ===== SUPPORT SYSTEM =====
  
  // Get user's support system
  getUserSupportSystem: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_support_system.findMany({
        where,
        orderBy: { reliability_level: 'desc' }
      });
    }),

  // Create support system entry
  createSupportSystemEntry: protectedProcedure
    .input(z.object({
      userId: z.string(),
      personName: z.string(),
      relationshipType: z.string().optional(),
      supportType: z.array(z.string()).optional(),
      reliabilityLevel: z.number().min(1).max(10).optional(),
      contactInfo: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_support_system.create({
        data: {
          user_id: input.userId,
          person_name: input.personName,
          relationship_type: input.relationshipType,
          support_type: input.supportType,
          reliability_level: input.reliabilityLevel || 5,
          contact_info: input.contactInfo
        }
      });
    }),

  // Update support system entry
  updateSupportSystemEntry: protectedProcedure
    .input(z.object({
      supportId: z.string(),
      personName: z.string().optional(),
      relationshipType: z.string().optional(),
      supportType: z.array(z.string()).optional(),
      reliabilityLevel: z.number().min(1).max(10).optional(),
      contactInfo: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { supportId, ...updateData } = input;
      return await ctx.prisma.user_support_system.update({
        where: { id: supportId },
        data: updateData
      });
    }),

  // ===== RELATIONSHIP STATUS =====
  
  // Get user's relationship status
  getUserRelationshipStatus: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user_relationship_status.findUnique({
        where: { user_id: input.userId }
      });
    }),

  // Create or update relationship status
  upsertRelationshipStatus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      currentStatus: z.string().optional(),
      partnerName: z.string().optional(),
      relationshipDuration: z.string().optional(),
      satisfactionLevel: z.number().min(1).max(10).optional(),
      challenges: z.array(z.string()).optional(),
      strengths: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...data } = input;
      return await ctx.prisma.user_relationship_status.upsert({
        where: { user_id: userId },
        update: data,
        create: {
          user_id: userId,
          ...data
        }
      });
    }),

  // ===== ANALYTICS =====
  
  // Get relationship statistics
  getRelationshipStats: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const [people, relationships, dynamics, supportSystem, relationshipStatus] = await Promise.all([
        ctx.prisma.user_people.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_relationships.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_relationship_dynamics.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_support_system.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_relationship_status.findUnique({
          where: { user_id: input.userId }
        })
      ]);

      const totalPeople = people.length;
      const highImportancePeople = people.filter(p => p.importance_level >= 8).length;
      const relationshipTypes = [...new Set(people.map(p => p.relationship_type).filter(Boolean))];
      const averageImportance = people.length > 0 
        ? people.reduce((sum, p) => sum + (p.importance_level || 0), 0) / people.length 
        : 0;

      const highSafetyDynamics = dynamics.filter(d => d.emotional_safety_level >= 8).length;
      const reliableSupport = supportSystem.filter(s => s.reliability_level >= 8).length;

      return {
        // People
        totalPeople,
        highImportancePeople,
        relationshipTypes,
        averageImportance,
        
        // Relationships
        totalRelationships: relationships.length,
        
        // Dynamics
        totalDynamics: dynamics.length,
        highSafetyDynamics,
        
        // Support system
        totalSupport: supportSystem.length,
        reliableSupport,
        
        // Relationship status
        hasRelationshipStatus: !!relationshipStatus,
        relationshipSatisfaction: relationshipStatus?.satisfaction_level || 0,
        
        // Overall relationship health
        relationshipHealthScore: calculateRelationshipHealthScore(
          people, dynamics, supportSystem, relationshipStatus
        )
      };
    })
});

// Helper function to calculate relationship health score
function calculateRelationshipHealthScore(
  people: any[], 
  dynamics: any[], 
  supportSystem: any[], 
  relationshipStatus: any
): number {
  let score = 50; // Base score
  
  // People importance (0-20 points)
  if (people.length > 0) {
    const avgImportance = people.reduce((sum, p) => sum + (p.importance_level || 0), 0) / people.length;
    score += (avgImportance / 10) * 20;
  }
  
  // Emotional safety in dynamics (0-15 points)
  if (dynamics.length > 0) {
    const avgSafety = dynamics.reduce((sum, d) => sum + (d.emotional_safety_level || 0), 0) / dynamics.length;
    score += (avgSafety / 10) * 15;
  }
  
  // Support system reliability (0-10 points)
  if (supportSystem.length > 0) {
    const avgReliability = supportSystem.reduce((sum, s) => sum + (s.reliability_level || 0), 0) / supportSystem.length;
    score += (avgReliability / 10) * 10;
  }
  
  // Relationship satisfaction (0-5 points)
  if (relationshipStatus?.satisfaction_level) {
    score += (relationshipStatus.satisfaction_level / 10) * 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
} 
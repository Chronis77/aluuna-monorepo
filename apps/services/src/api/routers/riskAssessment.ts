import { initTRPC } from '@trpc/server';
import { Context } from '../context.js';

const t = initTRPC.context<Context>().create();
import { protectedProcedure } from '../middleware/auth.js';
import { z } from 'zod';

export const riskAssessmentRouter = t.router({
  // ===== RISK FACTORS =====
  
  // Get user's risk factors
  getUserRiskFactors: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      if (input.category) {
        where.risk_category = input.category;
      }
      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }
      
      return await ctx.prisma.user_risk_factors.findMany({
        where,
        orderBy: { severity_level: 'desc' }
      });
    }),

  // Create risk factor
  createRiskFactor: protectedProcedure
    .input(z.object({
      userId: z.string(),
      riskFactorName: z.string(),
      riskCategory: z.string().optional(),
      severityLevel: z.number().min(1).max(10).optional(),
      triggers: z.array(z.string()).optional(),
      warningSigns: z.array(z.string()).optional(),
      safetyPlan: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_risk_factors.create({
        data: {
          user_id: input.userId,
          risk_factor_name: input.riskFactorName,
          risk_category: input.riskCategory,
          severity_level: input.severityLevel || 5,
          triggers: input.triggers,
          warning_signs: input.warningSigns,
          safety_plan: input.safetyPlan
        }
      });
    }),

  // Update risk factor
  updateRiskFactor: protectedProcedure
    .input(z.object({
      riskFactorId: z.string(),
      riskFactorName: z.string().optional(),
      riskCategory: z.string().optional(),
      severityLevel: z.number().min(1).max(10).optional(),
      triggers: z.array(z.string()).optional(),
      warningSigns: z.array(z.string()).optional(),
      safetyPlan: z.string().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { riskFactorId, ...updateData } = input;
      return await ctx.prisma.user_risk_factors.update({
        where: { id: riskFactorId },
        data: updateData
      });
    }),

  // Delete risk factor (soft delete)
  deleteRiskFactor: protectedProcedure
    .input(z.object({
      riskFactorId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_risk_factors.update({
        where: { id: input.riskFactorId },
        data: { is_active: false }
      });
    }),

  // ===== SUICIDAL THOUGHTS =====
  
  // Get user's suicidal thoughts
  getUserSuicidalThoughts: protectedProcedure
    .input(z.object({
      userId: z.string(),
      startDate: z.string().optional(), // ISO date string
      endDate: z.string().optional(), // ISO date string
      limit: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: input.userId };
      
      if (input.startDate || input.endDate) {
        where.thought_date = {};
        if (input.startDate) {
          where.thought_date.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          where.thought_date.lte = new Date(input.endDate);
        }
      }
      
      return await ctx.prisma.user_suicidal_thoughts.findMany({
        where,
        orderBy: { thought_date: 'desc' },
        take: input.limit || 50
      });
    }),

  // Create suicidal thought entry
  createSuicidalThought: protectedProcedure
    .input(z.object({
      userId: z.string(),
      thoughtDate: z.string(), // ISO date string
      thoughtContent: z.string().optional(),
      intensityLevel: z.number().min(1).max(10).optional(),
      riskLevel: z.number().min(1).max(10).optional(),
      protectiveFactors: z.array(z.string()).optional(),
      safetyPlanActivated: z.boolean().optional(),
      professionalHelpSought: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user_suicidal_thoughts.create({
        data: {
          user_id: input.userId,
          thought_date: new Date(input.thoughtDate),
          thought_content: input.thoughtContent,
          intensity_level: input.intensityLevel || 5,
          risk_level: input.riskLevel || 5,
          protective_factors: input.protectiveFactors,
          safety_plan_activated: input.safetyPlanActivated || false,
          professional_help_sought: input.professionalHelpSought || false
        }
      });
    }),

  // Update suicidal thought entry
  updateSuicidalThought: protectedProcedure
    .input(z.object({
      thoughtId: z.string(),
      thoughtContent: z.string().optional(),
      intensityLevel: z.number().min(1).max(10).optional(),
      riskLevel: z.number().min(1).max(10).optional(),
      protectiveFactors: z.array(z.string()).optional(),
      safetyPlanActivated: z.boolean().optional(),
      professionalHelpSought: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { thoughtId, ...updateData } = input;
      return await ctx.prisma.user_suicidal_thoughts.update({
        where: { id: thoughtId },
        data: updateData
      });
    }),

  // ===== CRISIS ASSESSMENT =====
  
  // Get high-risk entries
  getHighRiskEntries: protectedProcedure
    .input(z.object({
      userId: z.string(),
      days: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [highRiskFactors, highRiskThoughts] = await Promise.all([
        ctx.prisma.user_risk_factors.findMany({
          where: {
            user_id: input.userId,
            severity_level: { gte: 8 },
            is_active: true
          }
        }),
        ctx.prisma.user_suicidal_thoughts.findMany({
          where: {
            user_id: input.userId,
            risk_level: { gte: 8 },
            thought_date: { gte: startDate }
          },
          orderBy: { thought_date: 'desc' }
        })
      ]);

      return {
        highRiskFactors,
        highRiskThoughts,
        totalHighRiskFactors: highRiskFactors.length,
        totalHighRiskThoughts: highRiskThoughts.length
      };
    }),

  // ===== ANALYTICS =====
  
  // Get risk assessment statistics
  getRiskAssessmentStats: protectedProcedure
    .input(z.object({
      userId: z.string(),
      days: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const days = input.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [riskFactors, suicidalThoughts] = await Promise.all([
        ctx.prisma.user_risk_factors.findMany({
          where: {
            user_id: input.userId,
            is_active: true
          }
        }),
        ctx.prisma.user_suicidal_thoughts.findMany({
          where: {
            user_id: input.userId,
            thought_date: { gte: startDate }
          }
        })
      ]);

      const totalRiskFactors = riskFactors.length;
      const highSeverityRiskFactors = riskFactors.filter(r => r.severity_level >= 8).length;
      const riskCategories = [...new Set(riskFactors.map(r => r.risk_category).filter(Boolean))];
      const averageSeverity = riskFactors.length > 0 
        ? riskFactors.reduce((sum, r) => sum + (r.severity_level || 0), 0) / riskFactors.length 
        : 0;

      const totalSuicidalThoughts = suicidalThoughts.length;
      const highRiskThoughts = suicidalThoughts.filter(t => t.risk_level >= 8).length;
      const thoughtsWithSafetyPlan = suicidalThoughts.filter(t => t.safety_plan_activated).length;
      const thoughtsWithProfessionalHelp = suicidalThoughts.filter(t => t.professional_help_sought).length;

      const averageRiskLevel = suicidalThoughts.length > 0 
        ? suicidalThoughts.reduce((sum, t) => sum + (t.risk_level || 0), 0) / suicidalThoughts.length 
        : 0;

      return {
        // Risk factors
        totalRiskFactors,
        highSeverityRiskFactors,
        riskCategories,
        averageSeverity,
        
        // Suicidal thoughts
        totalSuicidalThoughts,
        highRiskThoughts,
        thoughtsWithSafetyPlan,
        thoughtsWithProfessionalHelp,
        averageRiskLevel,
        
        // Overall risk assessment
        overallRiskLevel: calculateOverallRiskLevel(riskFactors, suicidalThoughts),
        requiresImmediateAttention: highRiskThoughts > 0 || highSeverityRiskFactors > 0
      };
    })
});

// Helper function to calculate overall risk level
function calculateOverallRiskLevel(riskFactors: any[], suicidalThoughts: any[]): number {
  let riskScore = 0;
  
  // Risk factors contribution (0-50 points)
  if (riskFactors.length > 0) {
    const avgSeverity = riskFactors.reduce((sum, r) => sum + (r.severity_level || 0), 0) / riskFactors.length;
    riskScore += (avgSeverity / 10) * 50;
  }
  
  // Suicidal thoughts contribution (0-50 points)
  if (suicidalThoughts.length > 0) {
    const avgRisk = suicidalThoughts.reduce((sum, t) => sum + (t.risk_level || 0), 0) / suicidalThoughts.length;
    riskScore += (avgRisk / 10) * 50;
  }
  
  return Math.max(0, Math.min(100, Math.round(riskScore)));
} 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      AnalyticsCache: {
        Row: {
          createdAt: string
          data: Json
          expiresAt: string | null
          generatedAt: string
          id: string
          key: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          data: Json
          expiresAt?: string | null
          generatedAt?: string
          id?: string
          key: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          data?: Json
          expiresAt?: string | null
          generatedAt?: string
          id?: string
          key?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Appointment: {
        Row: {
          actualMinutes: number | null
          appointmentType: string
          bookedAt: string | null
          bookedBy: string
          cancelledAt: string | null
          cancelReason: string | null
          completedAt: string | null
          confirmedAt: string | null
          contactedViaWhatsApp: boolean | null
          createdAt: string | null
          createdBy: string | null
          endTimeUTC: string
          familyId: string | null
          id: string
          notes: string | null
          rescheduleCount: number | null
          startTimeUTC: string
          status: Database["public"]["Enums"]["AppointmentStatus"] | null
          studentId: string | null
          studentTimezone: string
          teacherId: string
          timezone: string
          updatedAt: string | null
          whatsappContactedAt: string | null
        }
        Insert: {
          actualMinutes?: number | null
          appointmentType?: string
          bookedAt?: string | null
          bookedBy: string
          cancelledAt?: string | null
          cancelReason?: string | null
          completedAt?: string | null
          confirmedAt?: string | null
          contactedViaWhatsApp?: boolean | null
          createdAt?: string | null
          createdBy?: string | null
          endTimeUTC: string
          familyId?: string | null
          id?: string
          notes?: string | null
          rescheduleCount?: number | null
          startTimeUTC: string
          status?: Database["public"]["Enums"]["AppointmentStatus"] | null
          studentId?: string | null
          studentTimezone?: string
          teacherId: string
          timezone: string
          updatedAt?: string | null
          whatsappContactedAt?: string | null
        }
        Update: {
          actualMinutes?: number | null
          appointmentType?: string
          bookedAt?: string | null
          bookedBy?: string
          cancelledAt?: string | null
          cancelReason?: string | null
          completedAt?: string | null
          confirmedAt?: string | null
          contactedViaWhatsApp?: boolean | null
          createdAt?: string | null
          createdBy?: string | null
          endTimeUTC?: string
          familyId?: string | null
          id?: string
          notes?: string | null
          rescheduleCount?: number | null
          startTimeUTC?: string
          status?: Database["public"]["Enums"]["AppointmentStatus"] | null
          studentId?: string | null
          studentTimezone?: string
          teacherId?: string
          timezone?: string
          updatedAt?: string | null
          whatsappContactedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Appointment_bookedBy_fkey"
            columns: ["bookedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_familyId_fkey"
            columns: ["familyId"]
            isOneToOne: false
            referencedRelation: "Family"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      AuditLog: {
        Row: {
          action: string
          createdAt: string | null
          entityId: string
          entityType: string
          id: string
          ipAddress: string | null
          newValue: Json | null
          oldValue: Json | null
          userAgent: string | null
          userId: string
        }
        Insert: {
          action: string
          createdAt?: string | null
          entityId: string
          entityType: string
          id?: string
          ipAddress?: string | null
          newValue?: Json | null
          oldValue?: Json | null
          userAgent?: string | null
          userId: string
        }
        Update: {
          action?: string
          createdAt?: string | null
          entityId?: string
          entityType?: string
          id?: string
          ipAddress?: string | null
          newValue?: Json | null
          oldValue?: Json | null
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AuditLog_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_enabled: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      Currency: {
        Row: {
          code: string
          exchangeRate: number
          id: string
          isEnabled: boolean
          name: string
          symbol: string
          updatedAt: string
        }
        Insert: {
          code: string
          exchangeRate: number
          id?: string
          isEnabled?: boolean
          name: string
          symbol: string
          updatedAt?: string
        }
        Update: {
          code?: string
          exchangeRate?: number
          id?: string
          isEnabled?: boolean
          name?: string
          symbol?: string
          updatedAt?: string
        }
        Relationships: []
      }
      DashboardMetrics: {
        Row: {
          calculatedAt: string
          expiresAt: string
          id: string
          metricType: string
          metricValue: Json
          userId: string
        }
        Insert: {
          calculatedAt?: string
          expiresAt: string
          id?: string
          metricType: string
          metricValue: Json
          userId: string
        }
        Update: {
          calculatedAt?: string
          expiresAt?: string
          id?: string
          metricType?: string
          metricValue?: Json
          userId?: string
        }
        Relationships: []
      }
      DashboardPreferences: {
        Row: {
          defaultDateRange: string
          id: string
          inAppEnabled: boolean
          quietHoursEnd: string | null
          quietHoursStart: string | null
          refreshInterval: number
          telegramEnabled: boolean
          updatedAt: string
          userId: string
          widgetConfig: Json
        }
        Insert: {
          defaultDateRange?: string
          id?: string
          inAppEnabled?: boolean
          quietHoursEnd?: string | null
          quietHoursStart?: string | null
          refreshInterval?: number
          telegramEnabled?: boolean
          updatedAt?: string
          userId: string
          widgetConfig?: Json
        }
        Update: {
          defaultDateRange?: string
          id?: string
          inAppEnabled?: boolean
          quietHoursEnd?: string | null
          quietHoursStart?: string | null
          refreshInterval?: number
          telegramEnabled?: boolean
          updatedAt?: string
          userId?: string
          widgetConfig?: Json
        }
        Relationships: [
          {
            foreignKeyName: "DashboardPreferences_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      EnabledCurrency: {
        Row: {
          currencyCode: string
          exchangeRate: number | null
          id: string
          isEnabled: boolean | null
          updatedAt: string | null
          updatedById: string
        }
        Insert: {
          currencyCode: string
          exchangeRate?: number | null
          id?: string
          isEnabled?: boolean | null
          updatedAt?: string | null
          updatedById: string
        }
        Update: {
          currencyCode?: string
          exchangeRate?: number | null
          id?: string
          isEnabled?: boolean | null
          updatedAt?: string | null
          updatedById?: string
        }
        Relationships: [
          {
            foreignKeyName: "EnabledCurrency_updatedBy_fkey"
            columns: ["updatedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Family: {
        Row: {
          countryCode: string
          createdAt: string | null
          id: string
          parentName: string
          phoneNumber: string
          platform: Database["public"]["Enums"]["Platform"] | null
          updatedAt: string | null
        }
        Insert: {
          countryCode: string
          createdAt?: string | null
          id?: string
          parentName: string
          phoneNumber: string
          platform?: Database["public"]["Enums"]["Platform"] | null
          updatedAt?: string | null
        }
        Update: {
          countryCode?: string
          createdAt?: string | null
          id?: string
          parentName?: string
          phoneNumber?: string
          platform?: Database["public"]["Enums"]["Platform"] | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          role: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      InvitationCode: {
        Row: {
          code: string
          createdAt: string | null
          createdBy: string
          currentUses: number | null
          expiresAt: string | null
          id: string
          isActive: boolean | null
          maxUses: number | null
          role: Database["public"]["Enums"]["UserRole"]
        }
        Insert: {
          code: string
          createdAt?: string | null
          createdBy: string
          currentUses?: number | null
          expiresAt?: string | null
          id?: string
          isActive?: boolean | null
          maxUses?: number | null
          role: Database["public"]["Enums"]["UserRole"]
        }
        Update: {
          code?: string
          createdAt?: string | null
          createdBy?: string
          currentUses?: number | null
          expiresAt?: string | null
          id?: string
          isActive?: boolean | null
          maxUses?: number | null
          role?: Database["public"]["Enums"]["UserRole"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_invitation_created_by"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      NotificationLog: {
        Row: {
          channel: Database["public"]["Enums"]["NotificationChannel"]
          createdAt: string
          deliveredAt: string | null
          failureReason: string | null
          id: string
          message: string
          metadata: Json | null
          n8nExecutionId: string | null
          n8nWorkflowId: string | null
          readAt: string | null
          recipientId: string
          retryCount: number
          sentAt: string | null
          status: Database["public"]["Enums"]["NotificationStatus"]
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["NotificationChannel"]
          createdAt?: string
          deliveredAt?: string | null
          failureReason?: string | null
          id?: string
          message: string
          metadata?: Json | null
          n8nExecutionId?: string | null
          n8nWorkflowId?: string | null
          readAt?: string | null
          recipientId: string
          retryCount?: number
          sentAt?: string | null
          status?: Database["public"]["Enums"]["NotificationStatus"]
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["NotificationChannel"]
          createdAt?: string
          deliveredAt?: string | null
          failureReason?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          n8nExecutionId?: string | null
          n8nWorkflowId?: string | null
          readAt?: string | null
          recipientId?: string
          retryCount?: number
          sentAt?: string | null
          status?: Database["public"]["Enums"]["NotificationStatus"]
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
        }
        Relationships: [
          {
            foreignKeyName: "NotificationLog_recipientId_fkey"
            columns: ["recipientId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Package: {
        Row: {
          createdAt: string | null
          createdBy: string
          description: string | null
          id: string
          isActive: boolean | null
          name: string
          price: number
          sessionCount: number
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          createdBy: string
          description?: string | null
          id?: string
          isActive?: boolean | null
          name: string
          price: number
          sessionCount: number
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          createdBy?: string
          description?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          price?: number
          sessionCount?: number
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Package_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          session_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          session_count: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          session_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      PaymentLink: {
        Row: {
          createdAt: string | null
          createdBy: string
          currency: string
          expiresAt: string
          familyId: string | null
          id: string
          isCustomPrice: boolean | null
          metadata: Json | null
          packages: Json
          status: Database["public"]["Enums"]["PaymentLinkStatus"] | null
          stripeSessionId: string | null
          studentIds: string[]
          totalAmount: number
          totalSessionCount: number
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          createdBy: string
          currency: string
          expiresAt: string
          familyId?: string | null
          id?: string
          isCustomPrice?: boolean | null
          metadata?: Json | null
          packages: Json
          status?: Database["public"]["Enums"]["PaymentLinkStatus"] | null
          stripeSessionId?: string | null
          studentIds: string[]
          totalAmount: number
          totalSessionCount?: number
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          createdBy?: string
          currency?: string
          expiresAt?: string
          familyId?: string | null
          id?: string
          isCustomPrice?: boolean | null
          metadata?: Json | null
          packages?: Json
          status?: Database["public"]["Enums"]["PaymentLinkStatus"] | null
          stripeSessionId?: string | null
          studentIds?: string[]
          totalAmount?: number
          totalSessionCount?: number
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PaymentLink_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PaymentLink_familyId_fkey"
            columns: ["familyId"]
            isOneToOne: false
            referencedRelation: "Family"
            referencedColumns: ["id"]
          },
        ]
      }
      PaymentTransaction: {
        Row: {
          amount: number
          currency: string
          id: string
          paymentLinkId: string
          processedAt: string | null
          status: string
          stripePaymentIntent: string | null
          webhookReceived: string | null
        }
        Insert: {
          amount: number
          currency: string
          id?: string
          paymentLinkId: string
          processedAt?: string | null
          status: string
          stripePaymentIntent?: string | null
          webhookReceived?: string | null
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          paymentLinkId?: string
          processedAt?: string | null
          status?: string
          stripePaymentIntent?: string | null
          webhookReceived?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PaymentTransaction_paymentLinkId_fkey"
            columns: ["paymentLinkId"]
            isOneToOne: false
            referencedRelation: "PaymentLink"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          language: string
          phone: string
          role: string
          status: string
          teacher_type: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          language?: string
          phone: string
          role: string
          status?: string
          teacher_type?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: string
          phone?: string
          role?: string
          status?: string
          teacher_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ScheduledSession: {
        Row: {
          actualMinutesTaught: number | null
          attendanceStatus:
            | Database["public"]["Enums"]["AttendanceStatus"]
            | null
          completedAt: string | null
          createdAt: string
          familyId: string | null
          id: string
          learningNotes: string | null
          originalTeacherId: string | null
          paymentLinkId: string
          reassignedBy: string | null
          reassignmentReason: string | null
          scheduledEndUTC: string
          scheduledStartUTC: string
          sessionNumber: number
          status: Database["public"]["Enums"]["SessionStatus"]
          studentId: string
          teacherId: string
          updatedAt: string
        }
        Insert: {
          actualMinutesTaught?: number | null
          attendanceStatus?:
            | Database["public"]["Enums"]["AttendanceStatus"]
            | null
          completedAt?: string | null
          createdAt?: string
          familyId?: string | null
          id?: string
          learningNotes?: string | null
          originalTeacherId?: string | null
          paymentLinkId: string
          reassignedBy?: string | null
          reassignmentReason?: string | null
          scheduledEndUTC: string
          scheduledStartUTC: string
          sessionNumber: number
          status?: Database["public"]["Enums"]["SessionStatus"]
          studentId: string
          teacherId: string
          updatedAt?: string
        }
        Update: {
          actualMinutesTaught?: number | null
          attendanceStatus?:
            | Database["public"]["Enums"]["AttendanceStatus"]
            | null
          completedAt?: string | null
          createdAt?: string
          familyId?: string | null
          id?: string
          learningNotes?: string | null
          originalTeacherId?: string | null
          paymentLinkId?: string
          reassignedBy?: string | null
          reassignmentReason?: string | null
          scheduledEndUTC?: string
          scheduledStartUTC?: string
          sessionNumber?: number
          status?: Database["public"]["Enums"]["SessionStatus"]
          studentId?: string
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ScheduledSession_familyId_fkey"
            columns: ["familyId"]
            isOneToOne: false
            referencedRelation: "Family"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduledSession_paymentLinkId_fkey"
            columns: ["paymentLinkId"]
            isOneToOne: false
            referencedRelation: "PaymentLink"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduledSession_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduledSession_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      StatusHistory: {
        Row: {
          changedBy: string
          createdAt: string | null
          fromStatus: Database["public"]["Enums"]["StudentStatus"] | null
          id: string
          reason: string | null
          studentId: string
          toStatus: Database["public"]["Enums"]["StudentStatus"]
        }
        Insert: {
          changedBy: string
          createdAt?: string | null
          fromStatus?: Database["public"]["Enums"]["StudentStatus"] | null
          id?: string
          reason?: string | null
          studentId: string
          toStatus: Database["public"]["Enums"]["StudentStatus"]
        }
        Update: {
          changedBy?: string
          createdAt?: string | null
          fromStatus?: Database["public"]["Enums"]["StudentStatus"] | null
          id?: string
          reason?: string | null
          studentId?: string
          toStatus?: Database["public"]["Enums"]["StudentStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "StatusHistory_changedBy_fkey"
            columns: ["changedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StatusHistory_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      Student: {
        Row: {
          activePaymentLinkId: string | null
          age: number | null
          countryCode: string
          createdAt: string | null
          email: string | null
          familyId: string | null
          id: string
          lastSessionDate: string | null
          name: string
          notes: string | null
          phoneNumber: string
          platform: Database["public"]["Enums"]["Platform"] | null
          rescheduleCount: number
          sessionsCompleted: number
          status: Database["public"]["Enums"]["StudentStatus"] | null
          teacherId: string | null
          totalSessionsPurchased: number
          updatedAt: string | null
        }
        Insert: {
          activePaymentLinkId?: string | null
          age?: number | null
          countryCode: string
          createdAt?: string | null
          email?: string | null
          familyId?: string | null
          id?: string
          lastSessionDate?: string | null
          name: string
          notes?: string | null
          phoneNumber: string
          platform?: Database["public"]["Enums"]["Platform"] | null
          rescheduleCount?: number
          sessionsCompleted?: number
          status?: Database["public"]["Enums"]["StudentStatus"] | null
          teacherId?: string | null
          totalSessionsPurchased?: number
          updatedAt?: string | null
        }
        Update: {
          activePaymentLinkId?: string | null
          age?: number | null
          countryCode?: string
          createdAt?: string | null
          email?: string | null
          familyId?: string | null
          id?: string
          lastSessionDate?: string | null
          name?: string
          notes?: string | null
          phoneNumber?: string
          platform?: Database["public"]["Enums"]["Platform"] | null
          rescheduleCount?: number
          sessionsCompleted?: number
          status?: Database["public"]["Enums"]["StudentStatus"] | null
          teacherId?: string | null
          totalSessionsPurchased?: number
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Student_familyId_fkey"
            columns: ["familyId"]
            isOneToOne: false
            referencedRelation: "Family"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Student_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      StudentPaymentLinks: {
        Row: {
          paymentLinkId: string
          studentId: string
        }
        Insert: {
          paymentLinkId: string
          studentId: string
        }
        Update: {
          paymentLinkId?: string
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "StudentPaymentLinks_paymentLinkId_fkey"
            columns: ["paymentLinkId"]
            isOneToOne: false
            referencedRelation: "PaymentLink"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StudentPaymentLinks_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      Supervisor: {
        Row: {
          createdAt: string
          id: string
          maxTeachers: number
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          maxTeachers?: number
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          maxTeachers?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Supervisor_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Teacher: {
        Row: {
          capacity: number | null
          createdAt: string | null
          currentStudents: number | null
          hourlyRate: number
          id: string
          isLocked: boolean | null
          lastAssignment: string | null
          lockedUntil: string | null
          roundRobinOrder: number | null
          supervisorId: string | null
          teacherType: Database["public"]["Enums"]["TeacherType"]
          updatedAt: string | null
          userId: string
        }
        Insert: {
          capacity?: number | null
          createdAt?: string | null
          currentStudents?: number | null
          hourlyRate?: number
          id?: string
          isLocked?: boolean | null
          lastAssignment?: string | null
          lockedUntil?: string | null
          roundRobinOrder?: number | null
          supervisorId?: string | null
          teacherType: Database["public"]["Enums"]["TeacherType"]
          updatedAt?: string | null
          userId: string
        }
        Update: {
          capacity?: number | null
          createdAt?: string | null
          currentStudents?: number | null
          hourlyRate?: number
          id?: string
          isLocked?: boolean | null
          lastAssignment?: string | null
          lockedUntil?: string | null
          roundRobinOrder?: number | null
          supervisorId?: string | null
          teacherType?: Database["public"]["Enums"]["TeacherType"]
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Teacher_supervisorId_fkey"
            columns: ["supervisorId"]
            isOneToOne: false
            referencedRelation: "Supervisor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Teacher_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean | null
          is_booked: boolean | null
          student_id: string | null
          teacher_id: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean | null
          is_booked?: boolean | null
          student_id?: string | null
          teacher_id: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean | null
          is_booked?: boolean | null
          student_id?: string | null
          teacher_id?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      TeacherAvailability: {
        Row: {
          createdAt: string | null
          dayOfWeek: number
          endTime: string
          id: string
          isActive: boolean | null
          startTime: string
          teacherId: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          dayOfWeek: number
          endTime: string
          id?: string
          isActive?: boolean | null
          startTime: string
          teacherId: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          dayOfWeek?: number
          endTime?: string
          id?: string
          isActive?: boolean | null
          startTime?: string
          teacherId?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "TeacherAvailability_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      TeacherBonus: {
        Row: {
          amount: number
          approvedBy: string
          createdAt: string
          id: string
          month: string
          reason: string | null
          teacherId: string
        }
        Insert: {
          amount: number
          approvedBy: string
          createdAt?: string
          id?: string
          month: string
          reason?: string | null
          teacherId: string
        }
        Update: {
          amount?: number
          approvedBy?: string
          createdAt?: string
          id?: string
          month?: string
          reason?: string | null
          teacherId?: string
        }
        Relationships: [
          {
            foreignKeyName: "TeacherBonus_approvedBy_fkey"
            columns: ["approvedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeacherBonus_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      TeacherEarning: {
        Row: {
          calculatedAmount: number
          createdAt: string
          hourlyRateAtTime: number
          id: string
          isPaid: boolean
          isReversal: boolean
          minutesTaught: number
          paidAt: string | null
          payrollBatchId: string | null
          payrollPeriod: string | null
          reversalOfId: string | null
          reversedById: string | null
          sessionId: string
          teacherId: string
        }
        Insert: {
          calculatedAmount: number
          createdAt?: string
          hourlyRateAtTime: number
          id?: string
          isPaid?: boolean
          isReversal?: boolean
          minutesTaught: number
          paidAt?: string | null
          payrollBatchId?: string | null
          payrollPeriod?: string | null
          reversalOfId?: string | null
          reversedById?: string | null
          sessionId: string
          teacherId: string
        }
        Update: {
          calculatedAmount?: number
          createdAt?: string
          hourlyRateAtTime?: number
          id?: string
          isPaid?: boolean
          isReversal?: boolean
          minutesTaught?: number
          paidAt?: string | null
          payrollBatchId?: string | null
          payrollPeriod?: string | null
          reversalOfId?: string | null
          reversedById?: string | null
          sessionId?: string
          teacherId?: string
        }
        Relationships: [
          {
            foreignKeyName: "TeacherEarning_sessionId_fkey"
            columns: ["sessionId"]
            isOneToOne: true
            referencedRelation: "ScheduledSession"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeacherEarning_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          approvedAt: string | null
          approvedBy: string | null
          createdAt: string | null
          email: string
          fullName: string
          id: string
          invitedById: string | null
          isActive: boolean | null
          language: Database["public"]["Enums"]["Language"] | null
          lastLogin: string | null
          passwordHash: string
          phoneNumber: string | null
          role: Database["public"]["Enums"]["Role"]
          telegramId: string | null
          updatedAt: string | null
        }
        Insert: {
          approvedAt?: string | null
          approvedBy?: string | null
          createdAt?: string | null
          email: string
          fullName: string
          id?: string
          invitedById?: string | null
          isActive?: boolean | null
          language?: Database["public"]["Enums"]["Language"] | null
          lastLogin?: string | null
          passwordHash: string
          phoneNumber?: string | null
          role: Database["public"]["Enums"]["Role"]
          telegramId?: string | null
          updatedAt?: string | null
        }
        Update: {
          approvedAt?: string | null
          approvedBy?: string | null
          createdAt?: string | null
          email?: string
          fullName?: string
          id?: string
          invitedById?: string | null
          isActive?: boolean | null
          language?: Database["public"]["Enums"]["Language"] | null
          lastLogin?: string | null
          passwordHash?: string
          phoneNumber?: string | null
          role?: Database["public"]["Enums"]["Role"]
          telegramId?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "User_approvedBy_fkey"
            columns: ["approvedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_invitedById_fkey"
            columns: ["invitedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      get_available_slots: {
        Args: {
          p_date: string
          p_timezone: string
          p_teacher_type: Database["public"]["Enums"]["TeacherType"]
          p_hour_start?: number
          p_hour_end?: number
        }
        Returns: {
          slot_start: string
          slot_end: string
          available_teachers: number
        }[]
      }
      get_next_available_teacher: {
        Args:
          | {
              p_teacher_type: Database["public"]["Enums"]["TeacherType"]
              p_start_time: string
              p_end_time: string
              p_day_of_week: number
            }
          | {
              p_teacher_type: Database["public"]["Enums"]["TeacherType"]
              p_start_time: string
              p_end_time: string
              p_day_of_week: number
            }
        Returns: string
      }
      update_round_robin_order: {
        Args: { p_teacher_id: string } | { p_teacher_id: string }
        Returns: undefined
      }
    }
    Enums: {
      AppointmentStatus:
        | "SCHEDULED"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      AttendanceStatus: "PRESENT" | "ABSENT" | "LATE"
      Language: "en" | "ar"
      NotificationChannel: "TELEGRAM" | "IN_APP" | "BOTH"
      NotificationStatus: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"
      NotificationType:
        | "TRIAL_ASSIGNED"
        | "TRIAL_REMINDER"
        | "TRIAL_COMPLETED"
        | "PAYMENT_CREATED"
        | "PAYMENT_RECEIVED"
        | "PAYMENT_EXPIRING"
        | "SESSION_REMINDER"
        | "SESSION_COMPLETED"
        | "STUDENT_EXPIRED"
        | "QUALITY_ALERT"
        | "SYSTEM_ALERT"
      PaymentLinkStatus: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED"
      Platform: "zoom" | "whatsapp"
      Role: "ADMIN" | "SALES" | "TEACHER" | "SUPERVISOR"
      SessionStatus:
        | "SCHEDULED"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
        | "RESCHEDULED"
      StudentStatus:
        | "PENDING"
        | "CONFIRMED"
        | "RESCHEDULED"
        | "TRIAL_COMPLETED"
        | "TRIAL_GHOSTED"
        | "AWAITING_PAYMENT"
        | "PAYMENT_EXPIRED"
        | "FOLLOW_UP"
        | "PAID"
        | "ACTIVE"
        | "EXPIRED"
        | "CANCELLED"
        | "DROPPED"
      TeacherType: "KIDS" | "ADULT" | "MIXED" | "EXPERT"
      UserRole: "ADMIN" | "SALES" | "TEACHER" | "SUPERVISOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AppointmentStatus: [
        "SCHEDULED",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      AttendanceStatus: ["PRESENT", "ABSENT", "LATE"],
      Language: ["en", "ar"],
      NotificationChannel: ["TELEGRAM", "IN_APP", "BOTH"],
      NotificationStatus: ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"],
      NotificationType: [
        "TRIAL_ASSIGNED",
        "TRIAL_REMINDER",
        "TRIAL_COMPLETED",
        "PAYMENT_CREATED",
        "PAYMENT_RECEIVED",
        "PAYMENT_EXPIRING",
        "SESSION_REMINDER",
        "SESSION_COMPLETED",
        "STUDENT_EXPIRED",
        "QUALITY_ALERT",
        "SYSTEM_ALERT",
      ],
      PaymentLinkStatus: ["PENDING", "PAID", "EXPIRED", "CANCELLED"],
      Platform: ["zoom", "whatsapp"],
      Role: ["ADMIN", "SALES", "TEACHER", "SUPERVISOR"],
      SessionStatus: [
        "SCHEDULED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
        "RESCHEDULED",
      ],
      StudentStatus: [
        "PENDING",
        "CONFIRMED",
        "RESCHEDULED",
        "TRIAL_COMPLETED",
        "TRIAL_GHOSTED",
        "AWAITING_PAYMENT",
        "PAYMENT_EXPIRED",
        "FOLLOW_UP",
        "PAID",
        "ACTIVE",
        "EXPIRED",
        "CANCELLED",
        "DROPPED",
      ],
      TeacherType: ["KIDS", "ADULT", "MIXED", "EXPERT"],
      UserRole: ["ADMIN", "SALES", "TEACHER", "SUPERVISOR"],
    },
  },
} as const


-- Add foreign key constraints to fix Supabase relationship queries

-- Add foreign key constraint for students.assigned_teacher_id -> profiles.id
ALTER TABLE public.students 
ADD CONSTRAINT fk_students_assigned_teacher 
FOREIGN KEY (assigned_teacher_id) REFERENCES public.profiles(id);

-- Add foreign key constraint for students.assigned_sales_agent_id -> profiles.id
ALTER TABLE public.students 
ADD CONSTRAINT fk_students_assigned_sales_agent 
FOREIGN KEY (assigned_sales_agent_id) REFERENCES public.profiles(id);

-- Add foreign key constraint for students.assigned_supervisor_id -> profiles.id
ALTER TABLE public.students 
ADD CONSTRAINT fk_students_assigned_supervisor 
FOREIGN KEY (assigned_supervisor_id) REFERENCES public.profiles(id);

-- Add foreign key constraint for sales_followups.student_id -> students.id
ALTER TABLE public.sales_followups 
ADD CONSTRAINT fk_sales_followups_student 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Add foreign key constraint for sales_followups.sales_agent_id -> profiles.id
ALTER TABLE public.sales_followups 
ADD CONSTRAINT fk_sales_followups_sales_agent 
FOREIGN KEY (sales_agent_id) REFERENCES public.profiles(id);

-- Add foreign key constraints for family_groups table
ALTER TABLE public.family_groups 
ADD CONSTRAINT fk_family_groups_assigned_teacher 
FOREIGN KEY (assigned_teacher_id) REFERENCES public.profiles(id);

ALTER TABLE public.family_groups 
ADD CONSTRAINT fk_family_groups_assigned_sales_agent 
FOREIGN KEY (assigned_sales_agent_id) REFERENCES public.profiles(id);

ALTER TABLE public.family_groups 
ADD CONSTRAINT fk_family_groups_assigned_supervisor 
FOREIGN KEY (assigned_supervisor_id) REFERENCES public.profiles(id);

-- Add foreign key constraint for family_groups link to students
ALTER TABLE public.students 
ADD CONSTRAINT fk_students_family_group 
FOREIGN KEY (family_group_id) REFERENCES public.family_groups(id) ON DELETE SET NULL;

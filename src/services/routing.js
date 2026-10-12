// Routing and visibility rules from the synopsis.
//
// In production these rules live in Supabase Row-Level Security policies, so
// the database itself refuses rows a role should not see. This file mirrors
// those policies on the client so the demo behaves the same way.
import { categoryOf, ROLES } from '../config/constants';

/** Decide how a new complaint is routed. */
export function buildRouting({ category, student, againstWardenId, hideFromChief }) {
  const route = categoryOf(category)?.route ?? 'warden';
  return {
    route,
    block: student.block,
    againstWardenId: route === 'bypass' ? againstWardenId : null,
    hideFromChief: route === 'dean' ? Boolean(hideFromChief) : false,
  };
}

/** Mirror of the complaints SELECT policy. */
export function canViewComplaint(user, c) {
  if (!user || !c) return false;
  switch (user.role) {
    case 'student':
      return c.studentId === user.id;
    case 'warden':
      // Only routine complaints from their own block. Complaints against a
      // warden are routed 'bypass', so they never reach any warden.
      return c.route === 'warden' && c.block === user.block && c.againstWardenId !== user.id;
    case 'chief':
      return c.route === 'warden' || c.route === 'bypass' || (c.route === 'dean' && !c.hideFromChief);
    case 'dean':
      return true;
    default:
      return false;
  }
}

/** Staff who can see a complaint can update its status. */
export function canUpdateComplaint(user, c) {
  return user?.role !== 'student' && canViewComplaint(user, c);
}

/** Mirror of the fines SELECT policy. */
export function canViewFine(user, fine, db) {
  if (!user) return false;
  const linked = fine.complaintId ? db.complaints.find((c) => c.id === fine.complaintId) : null;
  // A fine linked to a complaint the viewer cannot see stays hidden too.
  if (linked && user.role !== 'student' && !canViewComplaint(user, linked)) return false;
  switch (user.role) {
    case 'student':
      return fine.studentId === user.id;
    case 'warden': {
      const student = db.users.find((u) => u.id === fine.studentId);
      return student?.block === user.block;
    }
    case 'chief':
    case 'dean':
      return true;
    default:
      return false;
  }
}

/** Wardens fine students in their block; Chief Warden and Dean can fine anyone. */
export function canFineStudent(user, student) {
  if (!user || !student || student.role !== 'student') return false;
  if (user.role === 'warden') return student.block === user.block;
  return user.role === 'chief' || user.role === 'dean';
}

/** Human-readable list of who can see a complaint. */
export function audienceFor(c) {
  if (c.route === 'warden') {
    return [`Warden, Block ${c.block}`, ROLES.chief.label, ROLES.dean.label];
  }
  if (c.route === 'bypass') {
    return [ROLES.chief.label, ROLES.dean.label];
  }
  return c.hideFromChief ? [ROLES.dean.label] : [ROLES.dean.label, ROLES.chief.label];
}

/** What staff see for a student: nickname only. The owner sees their real name. */
export function studentDisplayName(viewer, student) {
  if (!student) return 'Unknown';
  if (viewer?.id === student.id) return `${student.name} (you)`;
  return student.nickname;
}

export function staffTitle(user) {
  if (!user) return '';
  if (user.role === 'warden') return `Warden, Block ${user.block}`;
  return ROLES[user.role]?.label ?? '';
}

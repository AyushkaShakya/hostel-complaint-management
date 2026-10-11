// Every page talks to the backend through this file. It forwards each call to
// the live Supabase backend when keys are set in .env, otherwise to demo data.
import { IS_LIVE } from '../config/env';
import * as demo from './demoApi';
import * as live from './supabaseApi';

const impl = IS_LIVE ? live : demo;

export const ApiError = impl.ApiError;
export const loadDatabase = (...a) => impl.loadDatabase(...a);
export const snapshot = (...a) => impl.snapshot(...a);
export const getSessionUserId = (...a) => impl.getSessionUserId(...a);
export const login = (...a) => impl.login(...a);
export const logout = (...a) => impl.logout(...a);
export const signup = (...a) => impl.signup(...a);
export const updateNickname = (...a) => impl.updateNickname(...a);
export const createComplaint = (...a) => impl.createComplaint(...a);
export const updateComplaintStatus = (...a) => impl.updateComplaintStatus(...a);
export const issueFine = (...a) => impl.issueFine(...a);
export const recordFinePayment = (...a) => impl.recordFinePayment(...a);
export const markEmailRead = (...a) => impl.markEmailRead(...a);
export const resetDemo = (...a) => impl.resetDemo(...a);

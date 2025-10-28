/**
 * Twilio Integration Library
 * Handles SMS messaging via Twilio APIs
 */

import twilio from 'twilio';
import { NextRequest } from 'next/server';

// ========================================
// Types
// ========================================

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  messagingServiceSid: string;
  alphaSenderName?: string;
  useAlphanumericSender: boolean;
}

export interface SmsOptions {
  to: string;
  body: string;
  statusCallback?: string;
}


export interface TwilioMessageResponse {
  sid: string;
  status: string;
  errorCode?: number;
  errorMessage?: string;
}

// ========================================
// Configuration
// ========================================

/**
 * Loads Twilio configuration from environment variables
 */
export function getTwilioConfig(): TwilioConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MSG_SERVICE_SID;

  if (!accountSid || !authToken || !messagingServiceSid) {
    throw new Error(
      'Missing required Twilio environment variables. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MSG_SERVICE_SID'
    );
  }

  return {
    accountSid,
    authToken,
    messagingServiceSid,
    alphaSenderName: process.env.ALPHA_SENDER_NAME || 'Sukaj SHPK',
    useAlphanumericSender: process.env.USE_ALPHANUMERIC_SENDER === 'true',
  };
}

/**
 * Initializes and returns a Twilio client instance
 */
export function getTwilioClient() {
  const config = getTwilioConfig();
  return twilio(config.accountSid, config.authToken);
}


// ========================================
// SMS Functions
// ========================================

/**
 * Sends an SMS with automatic fallback from alphanumeric sender to phone number
 * 
 * @param options - SMS options including recipient and message body
 * @returns Message SID and status
 * 
 * @example
 * ```ts
 * const result = await sendSmsWithFallback({
 *   to: '+355691234567',
 *   body: 'Your rent is due today',
 *   statusCallback: 'https://example.com/webhook'
 * });
 * ```
 */
export async function sendSmsWithFallback(
  options: SmsOptions
): Promise<TwilioMessageResponse> {
  const config = getTwilioConfig();
  const client = getTwilioClient();

  try {
    const messageParams: any = {
      to: options.to,
      body: options.body,
      messagingServiceSid: config.messagingServiceSid,
    };

    // Use alphanumeric sender if enabled
    if (config.useAlphanumericSender && config.alphaSenderName) {
      messageParams.from = config.alphaSenderName;
      console.log(`Attempting SMS with alphanumeric sender: ${config.alphaSenderName}`);
    }

    // Add status callback if provided
    if (options.statusCallback) {
      messageParams.statusCallback = options.statusCallback;
    }

    const message = await client.messages.create(messageParams);

    console.log(`SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`);

    return {
      sid: message.sid,
      status: message.status,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);

    // If alphanumeric sender failed due to carrier restrictions, try fallback
    if (
      config.useAlphanumericSender &&
      error.code &&
      [21211, 21606, 21408].includes(error.code) // Common alphanumeric sender errors
    ) {
      console.warn(
        `Alphanumeric sender failed (code ${error.code}). Falling back to Messaging Service default sender...`
      );

      try {
        // Retry without alphanumeric sender (let Messaging Service choose)
        const fallbackMessage = await client.messages.create({
          to: options.to,
          body: options.body,
          messagingServiceSid: config.messagingServiceSid,
          statusCallback: options.statusCallback,
        });

        console.log(
          `SMS sent via fallback. SID: ${fallbackMessage.sid}, Status: ${fallbackMessage.status}`
        );

        return {
          sid: fallbackMessage.sid,
          status: fallbackMessage.status,
        };
      } catch (fallbackError: any) {
        console.error('Fallback SMS also failed:', fallbackError);
        throw fallbackError;
      }
    }

    // Re-throw if not an alphanumeric sender issue
    throw error;
  }
}



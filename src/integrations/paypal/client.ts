/// <reference types="@paypal/paypal-js" />
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase Client (Uses .env variables)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase environment variables are missing! Check your .env file."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

declare global {
  interface Window {
    paypal?: any;
  }
}

// ✅ Fetch PayPal Client ID from Supabase `app_settings` table
export async function fetchPayPalCredentials() {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "paypal_client_id")
      .single();

    if (error) throw error;
    if (!data?.value) throw new Error("PayPal Client ID not found in Supabase");

    console.log("DEBUG: PayPal Client ID fetched successfully:", data.value);
    return { clientId: data.value };
  } catch (error) {
    console.error("DEBUG: Error fetching PayPal credentials:", error);
    return { clientId: "" };
  }
}

// ✅ Load PayPal SDK (Ensuring Card Payments & Guest Checkout Work)
export async function loadPayPalSDK(clientId: string) {
  if (!clientId) {
    console.error("DEBUG: Missing PayPal Client ID");
    return;
  }

  if (document.getElementById("paypal-sdk")) {
    console.log("DEBUG: PayPal SDK already loaded");
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&commit=false&enable-funding=card`;
    script.async = true;
    script.onload = () => {
      console.log("DEBUG: PayPal SDK Loaded Successfully");
      resolve(true);
    };
    script.onerror = () => {
      console.error("DEBUG: Failed to load PayPal SDK");
      reject("PayPal SDK load error");
    };

    document.body.appendChild(script);
  });
}

// ✅ PayPal Client Integration
export const paypalClient = {
  createDeposit: async (
    amount: number,
    userId: string,
    targetElementId: string,
    deposit: (amount: number, method: string) => Promise<void>
  ) => {
    console.log(`DEBUG: Setting up PayPal deposit for $${amount}`);

    if (!targetElementId) {
      console.error(
        "ERROR: targetElementId is undefined! Ensure it is provided."
      );
      return;
    }

    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(
        `ERROR: No element found with ID '${targetElementId}'. Check your component.`
      );
      return;
    }

    try {
      // ✅ Show loading animation
      targetElement.innerHTML = `
                <div class="flex items-center justify-center p-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p class="ml-2 text-sm text-gray-500">Loading PayPal checkout...</p>
                </div>
            `;

      // ✅ Fetch PayPal Client ID
      const { clientId } = await fetchPayPalCredentials();
      if (!clientId) throw new Error("Invalid PayPal Client ID");

      // ✅ Load PayPal SDK before rendering buttons
      await loadPayPalSDK(clientId );
   

      if (!window.paypal || !window.paypal.Buttons) {
        throw new Error("PayPal SDK failed to initialize.");
      }

      // ✅ Render PayPal Buttons
      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
          },

          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: { value: amount.toString(), currency_code: "USD" },
                },
              ],
              application_context: { shipping_preference: "NO_SHIPPING" },
            });
          },

          onApprove: async (data: any, actions: any) => {
            try {
              console.log("DEBUG: Payment approved, capturing order...");
              const details = await actions.order.capture();
              console.log("DEBUG: Transaction completed:", details);
              const amount = parseFloat(details.purchase_units[0].amount.value);

              // ✅ Log Transaction in Supabase
              const { error } = await supabase.rpc("log_transaction", {
                user_id: userId,
                deposit_amount: amount,
              });
              localStorage.setItem('pendingDepositAmount', String(amount));
              await deposit(amount, "paypal");

              if (error) {
                console.error(
                  "DEBUG: Error updating balance in Supabase:",
                  error
                );
                //throw new Error("Failed to update balance.");
              }

              // ✅ Redirect after successful deposit
              window.location.href = "/wallet?success=true";
            } catch (error) {
              console.error("DEBUG: Error processing PayPal deposit:", error);
              targetElement.innerHTML = `<p class="text-red-500">Error processing deposit.</p>`;
            }
          },

          onCancel: async () => {
            console.log("DEBUG: Payment cancelled by user");
            targetElement.innerHTML = "";

           

            window.location.href = "/wallet?cancel=true";
          },

          onError: (err: any) => {
            console.error("DEBUG: PayPal error:", err);
            targetElement.innerHTML = `<p class="text-red-500">Error with PayPal checkout.</p>`;
          },
        })
        .render(targetElement);

      console.log("DEBUG: PayPal buttons rendered successfully");
    } catch (error) {
      console.error("DEBUG: PayPal deposit setup error:", error);
      targetElement.innerHTML = `<p class="text-red-500">Unable to load PayPal checkout.</p>`;
    }
  },
};

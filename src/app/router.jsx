import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AppShell from "../layouts/Appshell";
import AppLayout from "../layouts/AppLayout";
import Home from "../pages/client/Home/Home";
import {
  Categories,
  Quotations,
  Orders,
  Wallet,
  Placeholder,
} from "../pages/client/ClientPages";
import ProductDetail from "../pages/client/ProductDetail";
import Explore from "../pages/client/Explore";
import Storefront from "../pages/client/Storefront";
import Account from "../pages/client/Account";
import Notifications from "../pages/client/Notifications";
import {
  Cart,
  Checkout,
  OrderDetail,
} from "../pages/client/Commerce";
import {
  DemoLogin,
  RequireRole,
  MerchantDashboard,
  MerchantProducts,
  MerchantOrders,
  MerchantInventory,
  MerchantFulfillment,
  MerchantEarnings,
  MerchantSettlements,
  MerchantAccount,
  AdminDashboard,
  AdminMerchants,
  AdminClients,
  AdminProducts,
  AdminOrders,
  AdminRefunds,
  AdminAuditLogs,
  SuperAdminSourcing,
  RolePlaceholder,
} from "../pages/RoleDemo";
import Welcome from "../pages/Welcome";
import Auth from "../pages/Auth";
import MerchantGate from "../pages/MerchantGate";
import {
  NewQuotationFlow,
  QuotationDetail,
} from "../pages/client/QuotationFlow";
import StartScreen from "../screen/StartScreen";
import LoadingScreen from "../screen/LoadingScreen";
import AdminLogin from "../pages/AdminLogin";
import Onboarding from "../screen/OnboardingScreen";

function MarketplaceRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/client/explore${search}`} replace />;
}

function ClientPlaceholder() {
  const route = useLocation().pathname.split("/").pop();
  return <Placeholder role="client" route={route} />;
}
function Screen({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  );
}

export default function AppRouter() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/loading" element={<LoadingScreen />} />

          <Route path="/onboarding/:slide" element={<Onboarding />} />
        <Route
          path="/welcome"
          element={
            <Screen>
              <Welcome />
            </Screen>
          }
        />
        <Route
          path="/auth/customer"
          element={
            <Screen>
              <Auth role="customer" />
            </Screen>
          }
        />
        <Route
          path="/auth/merchant"
          element={
            <Screen>
              <Auth role="merchant" />
            </Screen>
          }
        />
        <Route path="/admin/login" element={<Screen><AdminLogin /></Screen>} />
        <Route
          path="/login"
          element={
            <Screen>
              <DemoLogin />
            </Screen>
          }
        />
        <Route
          element={
            <RequireRole allowedRoles={["customer"]}>
              <AppShell />
            </RequireRole>
          }
        >
          <Route
            path="/client/overview"
            element={
              <Screen>
                <Home />
              </Screen>
            }
          />
          <Route
            path="/client/explore"
            element={
              <Screen>
                <Explore />
              </Screen>
            }
          />
          <Route path="/client/marketplace" element={<MarketplaceRedirect />} />
          <Route
            path="/client/store/:id"
            element={
              <Screen>
                <Storefront />
              </Screen>
            }
          />
          <Route
            path="/client/account"
            element={
              <Screen>
                <Account />
              </Screen>
            }
          />
          <Route
            path="/client/notifications"
            element={
              <Screen>
                <Notifications audience="customer" />
              </Screen>
            }
          />
          <Route
            path="/client/categories"
            element={
              <Screen>
                <Categories />
              </Screen>
            }
          />
          <Route
            path="/client/product/:id"
            element={
              <Screen>
                <ProductDetail />
              </Screen>
            }
          />
          <Route
            path="/client/cart"
            element={
              <Screen>
                <Cart />
              </Screen>
            }
          />
          <Route
            path="/client/checkout"
            element={
              <Screen>
                <Checkout />
              </Screen>
            }
          />
          <Route
            path="/client/quotations"
            element={
              <Screen>
                <Quotations />
              </Screen>
            }
          />
          <Route
            path="/client/quotations/new"
            element={
              <Screen>
                <NewQuotationFlow />
              </Screen>
            }
          />
          <Route
            path="/client/quotations/:id"
            element={
              <Screen>
                <QuotationDetail />
              </Screen>
            }
          />
          <Route
            path="/client/orders"
            element={
              <Screen>
                <Orders />
              </Screen>
            }
          />
          <Route
            path="/client/orders/:id"
            element={
              <Screen>
                <OrderDetail />
              </Screen>
            }
          />
          <Route
            path="/client/wallet"
            element={
              <Screen>
                <Wallet />
              </Screen>
            }
          />
          <Route path="/client/*" element={<ClientPlaceholder />} />
        </Route>

        <Route
          path="/merchant/overview"
          element={
            <RequireRole allowedRoles={["merchant"]}>
              <MerchantGate>
                <AppLayout role="merchant">
                  <Screen>
                    <MerchantDashboard />
                  </Screen>
                </AppLayout>
              </MerchantGate>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/products"
          element={
            <RequireRole allowedRoles={["merchant"]}>
              <MerchantGate>
                <AppLayout role="merchant">
                  <Screen>
                    <MerchantProducts />
                  </Screen>
                </AppLayout>
              </MerchantGate>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/orders"
          element={
            <RequireRole allowedRoles={["merchant"]}>
              <MerchantGate>
                <AppLayout role="merchant">
                  <Screen>
                    <MerchantOrders />
                  </Screen>
                </AppLayout>
              </MerchantGate>
            </RequireRole>
          }
        />
        <Route path="/merchant/inventory" element={<RequireRole allowedRoles={["merchant"]}><MerchantGate><AppLayout role="merchant"><Screen><MerchantInventory /></Screen></AppLayout></MerchantGate></RequireRole>} />
        <Route path="/merchant/fulfillment" element={<RequireRole allowedRoles={["merchant"]}><MerchantGate><AppLayout role="merchant"><Screen><MerchantFulfillment /></Screen></AppLayout></MerchantGate></RequireRole>} />
        <Route path="/merchant/earnings" element={<RequireRole allowedRoles={["merchant"]}><MerchantGate><AppLayout role="merchant"><Screen><MerchantEarnings /></Screen></AppLayout></MerchantGate></RequireRole>} />
        <Route
          path="/merchant/settlements"
          element={
            <RequireRole allowedRoles={["merchant"]}>
              <MerchantGate>
                <AppLayout role="merchant">
                  <Screen>
                    <MerchantSettlements />
                  </Screen>
                </AppLayout>
              </MerchantGate>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/account"
          element={
            <RequireRole allowedRoles={["merchant"]}>
              <MerchantGate>
                <AppLayout role="merchant">
                  <Screen>
                    <MerchantAccount />
                  </Screen>
                </AppLayout>
              </MerchantGate>
            </RequireRole>
          }
        />
        <Route
          path="/merchant/*"
          element={
            <RequireRole allowedRoles={["merchant"]}>
              <MerchantGate>
                <AppLayout role="merchant">
                  <RolePlaceholder role="merchant" />
                </AppLayout>
              </MerchantGate>
            </RequireRole>
          }
        />

        <Route
          path="/admin/overview"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <AdminDashboard />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/merchants"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <AdminMerchants />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/clients"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <AdminClients />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <AdminProducts />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <AdminOrders />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <AdminRefunds />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <AdminAuditLogs />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/sourcing"
          element={
            <RequireRole allowedRoles={["super-admin"]}>
              <AppLayout role="admin">
                <Screen>
                  <SuperAdminSourcing />
                </Screen>
              </AppLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RequireRole allowedRoles={["admin", "super-admin"]}>
              <AppLayout role="admin">
                <RolePlaceholder role="admin" />
              </AppLayout>
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

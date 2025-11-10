import express from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import * as companyController from "../controllers/company.controller";

const router = express.Router();

// =============================================
// COMPANY ROUTES
// =============================================

// Get all companies (Admin, Coordinator, Student)
router.get("/", authenticate, authorize(["ADMIN", "COORDINATOR", "STUDENT"]), companyController.getAllCompanies);

// Get company by ID (Admin, Coordinator, Student)
router.get("/:id", authenticate, authorize(["ADMIN", "COORDINATOR", "STUDENT"]), companyController.getCompanyById);

// Create new company (Admin, Coordinator)
router.post("/", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.createCompany);

// Update company (Admin, Coordinator)
router.put("/:id", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.updateCompany);

// Delete company (Admin, Coordinator)
router.delete("/:id", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.deleteCompany);

// Create or link supervisor account (Admin, Coordinator)
router.post("/:id/supervisor", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.createSupervisorAccount);

// =============================================
// MOA ROUTES (Using Document model)
// =============================================

// Get all MOAs (Admin, Coordinator)
router.get("/moas/all", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.getAllMOAs);

// Get MOA by ID (Admin, Coordinator)
router.get("/moas/:id", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.getMOAById);

// Approve MOA (Admin, Coordinator)
router.patch("/moas/:id/approve", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.approveMOA);

// Reject MOA (Admin, Coordinator)
router.patch("/moas/:id/reject", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.rejectMOA);

// Get MOA statistics (Admin, Coordinator)
router.get("/moas/stats/overview", authenticate, authorize(["ADMIN", "COORDINATOR"]), companyController.getMOAStats);


export default router;
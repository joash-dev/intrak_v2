import { useState, useEffect } from "react";
import {
  Award,
  AlertCircle,
  Search,
  X,
  CheckCircle,
  Loader2,
  Star,
  TrendingUp,
  FileText,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import type {
  SupervisorStudent,
  InternshipEvaluationData,
} from "../../services/supervisorService";
import toast from "react-hot-toast";

type CompetencyConfig = {
  id: string;
  title: string;
  weight: string;
  criteria: { rating: number; text: string }[];
};

const competencyList: CompetencyConfig[] = [
  {
    id: "abilityToLearn",
    title: "A. Ability to Learn (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Grasps new ideas quickly, can readily apply knowledge to new situations, flexible problem solver",
      },
      {
        rating: 4,
        text: "Learns quickly, applies past experiences",
      },
      {
        rating: 3,
        text: "Usually understands instructions; usually has good judgment and reasoning",
      },
      {
        rating: 2,
        text: "Slow to grasp concepts, sometimes does not remember important facts and procedures",
      },
      {
        rating: 1,
        text: "Does not easily understand; needs repeated instructions on the same tasks.",
      },
    ],
  },
  {
    id: "workAttitude",
    title: "B. Work Attitude (15%)",
    weight: "15%",
    criteria: [
      {
        rating: 5,
        text: "Possesses a positive perspective; always upbeat and ready to work; a pleasure to work with; always reports to work ahead of time without any absences and tardiness",
      },
      {
        rating: 4,
        text: "Accepts all work assignments; rarely complains; communicates well with superiors and coworkers; observes regularity and punctuality in attendance",
      },
      {
        rating: 3,
        text: "Takes setback in strides; pleasant and cooperative in most situations; reports to work on time with minimal absences or tardiness.",
      },
      {
        rating: 2,
        text: "Complains that many things are unfair, a whiner; reports to work but sometimes tardy and absent.",
      },
      {
        rating: 1,
        text: "Continually gripes about work assignments; disturbs others; uncooperative; temperamental; frequent absences or tardiness.",
      },
    ],
  },
  {
    id: "conduct",
    title: "C. Conduct (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Always polite; careful not to offend anyone, maintains proper composure; makes special efforts to be helpful.",
      },
      {
        rating: 4,
        text: "Mostly polite and helpful; recognizes importance of human relationships; rarely losses temper.",
      },
      {
        rating: 3,
        text: "Observes common courtesy but doesn't always recognize opportunities and/or need to be polite or helpful.",
      },
      {
        rating: 2,
        text: "Harasses others; occasionally rude, foul language; not sensitive to others.",
      },
      {
        rating: 1,
        text: "Rude; ill mannered; uses obscene language; poor control of emotions; disrespectful to others.",
      },
    ],
  },
  {
    id: "motivationInitiative",
    title: "D. Motivation / Initiative (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Curiosity goes beyond immediate job procedures; eager to learn more; works hard.",
      },
      {
        rating: 4,
        text: "Good knowledge of most procedures; anticipates next steps; goes beyond expectations and prepares ahead.",
      },
      {
        rating: 3,
        text: "Asks questions; has adequate degree of knowledge; does routine tasks without prompting; ready with tools.",
      },
      {
        rating: 2,
        text: "Does what is told; sometimes anticipates parts of the job; does no more than what is required; seems uninterested at times.",
      },
      {
        rating: 1,
        text: "Never anticipates requirements of any job or procedure; always wants or has to be told what to do; lacks initiatives, needs prodding.",
      },
    ],
  },
  {
    id: "qualityAccuracy",
    title: "E. Quality and Accuracy of Work (20%)",
    weight: "20%",
    criteria: [
      {
        rating: 5,
        text: "Work is very accurate; work meets or exceeds standards; takes pride in his/her work.",
      },
      {
        rating: 4,
        text: "Does good work; careful; makes very few mistakes; uses good judgment.",
      },
      {
        rating: 3,
        text: "Work usually meets standard or expectations; needs some extra supervision.",
      },
      {
        rating: 2,
        text: "Aims just to get by; careless; some job need to be reworked",
      },
      {
        rating: 1,
        text: "Makes frequent mistakes; wastes materials; lacks mechanical ability; needs constant supervision.",
      },
    ],
  },
  {
    id: "quantityOfWork",
    title: "F. Quantity of Work (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Highly productive; fast and accurate; when finished with assigned tasks finds others task to advance the job.",
      },
      {
        rating: 4,
        text: "Plans work well; works efficient; gets expected work on time.",
      },
      {
        rating: 3,
        text: "Does fair share; looks busy but after finishing a task usually doesn’t look for other tasks that need to be done.",
      },
      {
        rating: 2,
        text: "Does less than expected; does just enough to get by; requires additional oversight.",
      },
      {
        rating: 1,
        text: "Doesn’t plans work; slow; procedures very little; wastes time; continually visiting with others which slows down the work.",
      },
    ],
  },
  {
    id: "safetyPractices",
    title: "G. Safety Practices (15%)",
    weight: "15%",
    criteria: [
      {
        rating: 5,
        text: "Always places safety first; helps others to be safe; does not take chances which might endangered self and others.",
      },
      {
        rating: 4,
        text: "Observes safety precautions; uses correct tools and wears appropriate safety apparel.",
      },
      {
        rating: 3,
        text: "Usually follows most safety procedures; usually does the job in safe manner.",
      },
      {
        rating: 2,
        text: "Careless, takes shortcuts which can create safety hazards.",
      },
      {
        rating: 1,
        text: "A hazard to self and others; potential for putting self and others at risk because of risky and unsafe attitude.",
      },
    ],
  },
  {
    id: "appearanceHygiene",
    title: "H. Appearance / Hygiene (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Clothes ideal for work; Appearance and hygiene would be acceptable to costumers and co-trainees/personnel.",
      },
      {
        rating: 4,
        text: "Arrives at work with clothes clean; showered and clean; clothes are proper, protective and safe.",
      },
      {
        rating: 3,
        text: "Clothes usually clean and appropriate for job; grooming acceptable",
      },
      {
        rating: 2,
        text: "Poorly groomed; hair disheveled; clothing barely job appropriate and unkempt.",
      },
      {
        rating: 1,
        text: "Generally not presentable: clothes dirty and not appropriate for the job; looks shabby; unclean; smells bad at times.",
      },
    ],
  },
];

type CompetencyFormState = Record<
  string,
  {
    rating: number;
    remarks: string;
  }
>;

const createInitialCompetencyState = (): CompetencyFormState =>
  competencyList.reduce((acc, competency) => {
    acc[competency.id] = { rating: 0, remarks: "" };
    return acc;
  }, {} as CompetencyFormState);

const SupervisorEvaluation = () => {
  const [selectedIntern, setSelectedIntern] =
    useState<SupervisorStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interns, setInterns] = useState<SupervisorStudent[]>([]);

  const [competencyRatings, setCompetencyRatings] = useState<CompetencyFormState>(
    createInitialCompetencyState()
  );

  useEffect(() => {
    fetchInterns();
  }, []);

  const userString =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userString ? JSON.parse(userString) : null;
  const companyName =
    user?.companyName ||
    user?.company ||
    user?.company?.name ||
    "Company";

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const students = await supervisorService.getMyStudents();
      setInterns(students);
    } catch (error) {
      console.error("Error fetching interns:", error);
      toast.error("Failed to load interns");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalInterns: interns.length,
    pendingEvaluations: interns.filter((i) => !i.lastEvaluation).length,
    avgRating:
      interns.length > 0
        ? (
            interns.reduce(
              (sum, i) => sum + (i.lastEvaluation?.overallRating || 0),
              0
            ) / interns.length
          ).toFixed(1)
        : "0.0",
  };

  const resetForm = () => {
    setCompetencyRatings(createInitialCompetencyState());
  };

  const handleStartEvaluation = (intern: SupervisorStudent) => {
    setSelectedIntern(intern);
    resetForm();
    setShowEvaluationForm(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedIntern) return;

    // Validation
    const allRated = Object.values(competencyRatings).every(
      (entry) => entry.rating > 0
    );
    if (!allRated) {
      toast.error("Please rate all categories");
      return;
    }

    try {
      setSubmitting(true);

      const totalPoints = Object.values(competencyRatings).reduce(
        (sum, entry) => sum + entry.rating,
        0
      );
      const ojtGrade = totalPoints * 10 + 50;

      const evaluationData: InternshipEvaluationData = {
        studentId: selectedIntern.id,
        competencies: competencyRatings,
        evaluatorName: user?.name || "",
        evaluatorPosition: user?.position || "",
        ojtGrade,
      };

      await supervisorService.submitEvaluation(evaluationData);
      toast.success(`Evaluation submitted for ${selectedIntern.name}`);
      setShowEvaluationForm(false);
      setSelectedIntern(null);
      resetForm();
      fetchInterns(); // Refresh data
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast.error("Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const buildOfficialFormHTML = (intern: SupervisorStudent) => {
    const resolvedCompanyName =
      user?.companyName ||
      user?.company ||
      user?.company?.name ||
      "Company";
    const resolvedCompanyAddress =
      user?.companyAddress ||
      (user?.company && user.company.address) ||
      "Not Provided";
    const totalPoints = Object.values(competencyRatings).reduce(
      (sum, entry) => sum + entry.rating,
      0
    );
    const ojtGrade = totalPoints * 10 + 50;
    const ratingRows = competencyList
      .map((competency) => {
        const entry = competencyRatings[competency.id];
        const remarks = escapeHtml(entry.remarks || "");
        const rows = competency.criteria
          .map((criterion, index) => {
            const isFirstRow = index === 0;
            return `
              <tr>
                ${
                  isFirstRow
                    ? `<td class="competency-name" rowspan="${competency.criteria.length}">
                        <strong>${escapeHtml(competency.title)}</strong>
                      </td>`
                    : ""
                }
                <td class="criteria-cell">${escapeHtml(criterion.text)}</td>
                <td class="rating-cell ${
                  entry.rating === criterion.rating ? "selected-rating" : ""
                }">${criterion.rating}</td>
                ${
                  isFirstRow
                    ? `<td class="remarks-cell" rowspan="${competency.criteria.length}">${remarks}</td>`
                    : ""
                }
              </tr>
            `;
          })
          .join("");

        return rows;
      })
      .join("");

    return `
      <html>
        <head>
          <title>Internship Evaluation Form</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #111;
            }
            .form-container {
              border: 2px solid #000;
              padding: 0;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0;
            }
            .header-table td {
              border: 1.5px solid #000;
              padding: 10px;
            }
            .header-logo {
              width: 120px;
              text-align: center;
            }
            .header-logo img {
              width: 90px;
              height: 90px;
              object-fit: contain;
            }
            .header-title {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 1px;
              width: 100%;
              font-family: Arial, sans-serif;
            }
            .header-subtitle {
              font-size: 14px;
              font-weight: normal;
              text-align: center;
              width: 100%;
              font-family: Arial, sans-serif;
            }
            .header-subtitle u {
              font-weight: bold;
            }
            .header-note {
              border: 1.5px solid #000;
              border-top: none;
              padding: 8px;
              font-size: 12px;
              text-align: center;
              margin: 0;
            }
            .instructions-block {
              border-left: 1.5px solid #000;
              border-right: 1.5px solid #000;
              border-bottom: 1.5px solid #000;
              padding: 10px 12px;
              font-size: 12px;
              line-height: 1.4;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border-spacing: 0;
              margin: 0;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th, td {
              padding: 2px;
              vertical-align: middle;
              font-size: 11px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
              table-layout: fixed;
            }
            .info-table td {
              border: 1.5px solid #000;
              padding: 4px 8px;
              vertical-align: middle;
              word-wrap: break-word;
              font-family: Arial, sans-serif;
            }
            .info-label {
              font-size: 10px;
              font-weight: bold;
              letter-spacing: 0.3px;
              background-color: #fff;
              width: 30%;
              text-transform: uppercase;
              line-height: 1.2;
              font-family: Arial, sans-serif;
            }
            .info-value {
              font-size: 11px;
              text-transform: uppercase;
              line-height: 1.2;
              background-color: #fff;
              width: 70%;
              font-family: Arial, sans-serif;
            }
            .info-table tr:last-child .info-label,
            .info-table tr:last-child .info-value {
              width: 25%;
            }
            .competency-table th {
              background: #f3f3f3;
              text-align: center;
            }
            .competency-name {
              width: 18%;
              font-weight: bold;
            }
            .criteria-cell {
              font-size: 12px;
              padding: 6px;
              text-align: left;
            }
            .rating-cell {
              width: 60px;
              text-align: center;
              font-size: 14px;
              font-weight: bold;
            }
            .rating-cell.selected-rating {
              background: #111;
              color: #fff;
            }
            .remarks-cell {
              font-size: 12px;
              padding: 6px;
              width: 180px;
            }
            .signature-block {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            .signature-line {
              border-top: 1px solid #111;
              width: 260px;
              text-align: center;
              padding-top: 4px;
              margin: 0 auto;
            }
            .ojt-grade-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .ojt-grade-table td {
              border: 1.5px solid #000;
              padding: 8px;
              font-size: 12px;
            }
            .grade-text {
              font-weight: bold;
              text-transform: uppercase;
            }
            .grade-score {
              width: 140px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
            }
            .note-banner {
              border: 1.5px solid #000;
              padding: 8px;
              font-size: 12px;
              text-align: center;
              margin: 0;
            }
            .termination-block {
              border: 1.5px solid #000;
              border-top: none;
              margin: 0;
            }
            .termination-title {
              font-size: 12px;
              font-style: italic;
              padding: 8px 10px 0 10px;
            }
            .termination-columns {
              display: flex;
            }
            .termination-column {
              flex: 1;
              padding: 8px 14px 10px 14px;
              font-size: 12px;
              line-height: 1.4;
            }
            .termination-item {
              margin-bottom: 4px;
            }
            .statement-block {
              border: 1.5px solid #000;
              border-top: none;
              padding: 0;
              font-size: 12px;
            }
            .statement-line {
              padding: 8px 12px;
            }
            .statement-line + .statement-line {
              border-top: 1px solid #000;
            }
            .signature-caption {
              margin-top: 4px;
            }
            .date-line {
              margin-top: 10px;
            }
            .signature-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
            }
            .signature-table td {
              border: 1.5px solid #000;
              padding: 16px 20px;
              vertical-align: top;
              text-align: center;
            }
            .signature-label {
              font-size: 12px;
              margin-top: 4px;
            }
            .signature-date {
              font-size: 12px;
              margin-top: 12px;
            }
            .approval-cell {
              text-align: left;
              height: 120px;
            }
          </style>
        </head>
        <body>
          <div class="form-container">
          <table class="header-table">
            <tr>
              <td class="header-logo" rowspan="2">
                <img src="${window.location.origin}/logo_intrak.png" alt="University Logo" />
              </td>
              <td class="header-title">INTERNSHIP EVALUATION FORM</td>
            </tr>
            <tr>
              <td class="header-subtitle">
                PANGASINAN STATE UNIVERSITY<br />
                <u>URDANETA Campus</u>
              </td>
            </tr>
          </table>
          <div class="header-note">
            This form is to be completed by the host company or a designated supervisor. This form shall be completed and submitted to the office of Campus Internship Coordinator and Internship / Practicum Subject Instructor upon completion of _____ training hours.
          </div>

          <table class="info-table">
            <tr>
              <td class="info-label">NAME OF STUDENT-INTERN</td>
              <td class="info-value" colspan="3">${escapeHtml(intern.name)}</td>
            </tr>
            <tr>
              <td class="info-label">NAME OF COMPANY / FIRM / AGENCY</td>
              <td class="info-value" colspan="3">${escapeHtml(resolvedCompanyName)}</td>
            </tr>
            <tr>
              <td class="info-label">COMPANY ADDRESS</td>
              <td class="info-value" colspan="3">${escapeHtml(resolvedCompanyAddress)}</td>
            </tr>
            <tr>
              <td class="info-label" style="width:25%;">DATE STARTED</td>
              <td class="info-value" style="width:25%;">${formatDate(intern.startDate)}</td>
              <td class="info-label" style="width:25%;">DATE ENDED</td>
              <td class="info-value" style="width:25%;">${formatDate(intern.endDate)}</td>
            </tr>
          </table>

          <div class="instructions-block">
            <strong>Instructions:</strong> Evaluate the student-intern fairly and honestly based on performance during the training period. Circle or indicate the number that best describes the intern for each competency.
          </div>

          <table class="competency-table">
            <thead>
              <tr>
                <th>Competency</th>
                <th>Criteria</th>
                <th>Rating</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${ratingRows}
            </tbody>
          </table>

          <table class="ojt-grade-table" style="margin-bottom:0;">
            <tr>
              <td class="grade-text">
                <strong>OJT GRADE</strong><br />
                = Total Points (A + B + C + D + E + F + G + H × 10) / 50 × 50 + 50
              </td>
              <td class="grade-score">${ojtGrade}</td>
            </tr>
          </table>

          <div class="note-banner" style="border-top: none;">
            Please discuss strengths & weaknesses with the student trainee to encourage and motivate improved performance.<br />
            NOTE: When you terminate a student-trainee for any reason, please check the items below.
          </div>

          <div class="termination-block">
            <div class="termination-title">The Internship Practicum was terminated:</div>
            <div class="termination-columns">
              <div class="termination-column">
                <div class="termination-item">_____ due "only" for lack of work</div>
                <div class="termination-item">_____ violation of Company Rules</div>
                <div class="termination-item">_____ unfavorable work habits and practices</div>
                <div class="termination-item">_____ altercation on the job</div>
              </div>
              <div class="termination-column">
                <div class="termination-item">_____ too much absences and tardiness</div>
                <div class="termination-item">_____ disrespectful to co-trainee or personnel</div>
                <div class="termination-item">_____ does not demonstrate interest and desire to learn</div>
                <div class="termination-item">
                  _____ other(s), please specify ____________________
                </div>
              </div>
            </div>
          </div>

          <div class="statement-block">
            <div class="statement-line">_____ We would be pleased to employ this Student-Trainee in the future</div>
            <div class="statement-line">_____ He/She needs to improve his/her performance.</div>
          </div>

          <table class="signature-table">
            <tr>
              <td style="border-right: none;">
                <div class="signature-label"><strong>${escapeHtml(
                  user?.name || ""
                )}</strong></div>
                <div class="signature-line"></div>
                <div class="signature-label">
                  Printed Name and Signature of Person Completing this Form
                </div>
                <div class="signature-date">Date: ____________________</div>
              </td>
              <td style="border-left: none;">
                <div class="signature-label"><strong>${escapeHtml(
                  intern.name
                )}</strong></div>
                <div class="signature-line"></div>
                <div class="signature-label">Signature of Student-Intern</div>
                <div class="signature-date">Date: ____________________</div>
              </td>
            </tr>
            <tr>
              <td class="approval-cell" colspan="2">
                <div class="signature-label" style="font-weight:bold; margin-bottom:18px;">APPROVED:</div>
                <div class="signature-line" style="width:250px;"></div>
                <div class="signature-caption">Training Supervisor</div>
              </td>
            </tr>
          </table>
          </div>
        </body>
      </html>
    `;
  };

  const handleExportOfficialForm = () => {
    if (!selectedIntern) return;
    const allRated = Object.values(competencyRatings).every(
      (entry) => entry.rating > 0
    );
    if (!allRated) {
      toast.error("Please provide ratings for all competencies before exporting.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) {
      toast.error("Please allow pop-ups to generate the form.");
      return;
    }
    const htmlContent = buildOfficialFormHTML(selectedIntern);
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusBadge = (intern: SupervisorStudent) => {
    if (intern.lastEvaluation) {
      return (
        <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          Evaluated
        </span>
      );
    } else {
      return (
        <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
          Pending
        </span>
      );
    }
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (filterStatus === "pending") {
      matchesFilter = !intern.lastEvaluation;
    } else if (filterStatus === "completed") {
      matchesFilter = !!intern.lastEvaluation;
    }

    return matchesSearch && matchesFilter;
  });

  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading evaluations...
            </p>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Intern Evaluations</h1>
        <p className="text-blue-100 text-lg mb-1">Company: {companyName}</p>
        <p className="text-blue-100">
          Evaluate and track intern performance - Rate skills and provide
          feedback
        </p>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Interns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Interns
                </p>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.totalInterns}
                </p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            Total interns
          </span>
              </div>

        {/* Pending Evaluation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Pending Evaluation
            </p>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.pendingEvaluations}
                </p>
          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            {stats.pendingEvaluations} pending
          </span>
          </div>

        {/* Avg Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Avg Rating
            </p>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.avgRating}
                </p>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Average score
          </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search interns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
            <option value="completed">Evaluated</option>
            </select>
          </div>
        </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredInterns.length} of {interns.length} interns
      </p>

      {/* Interns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredInterns.map((intern) => (
                  <div
                    key={intern.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {intern.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {intern.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                    {intern.studentNumber}
                          </p>
                  <p className="text-xs text-gray-500">{intern.program}</p>
                        </div>
                      </div>
              {getStatusBadge(intern)}
                    </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Hours
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {intern.completedHours}/{intern.totalHours}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Attendance
                        </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {intern.attendanceRate}%
                        </p>
                      </div>
                    </div>

                    {intern.lastEvaluation && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                              Last Evaluation
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(
                        intern.lastEvaluation.date
                      ).toLocaleDateString()}
                            </p>
                          </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {intern.lastEvaluation.overallRating.toFixed(1)}
                              </span>
                          </div>
                        </div>
                      </div>
                    )}

                          <button
              onClick={() => handleStartEvaluation(intern)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Award className="w-4 h-4" />
              <span>
                {intern.lastEvaluation ? "Re-evaluate" : "Evaluate Now"}
              </span>
                        </button>
                      </div>
        ))}
                  </div>

                {filteredInterns.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No interns found</p>
                  </div>
                )}

        {/* Evaluation Form Modal */}
        {showEvaluationForm && selectedIntern && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ margin: "0" }}
          onClick={() => !submitting && setShowEvaluationForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Evaluate Intern
                      </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedIntern.name} - {selectedIntern.studentNumber}
                      </p>
                  </div>
                  <button
                onClick={() => !submitting && setShowEvaluationForm(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                disabled={submitting}
                  >
                    <X className="w-5 h-5" />
                  </button>
              </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
              <div className="space-y-5">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Internship Evaluation Competencies
                      </h4>

                {competencyList.map((competency) => {
                  const state = competencyRatings[competency.id];
                  return (
                    <div
                      key={competency.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm uppercase text-gray-500 dark:text-gray-400 font-semibold">
                            {competency.weight}
                          </p>
                          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {competency.title}
                          </h5>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-200">
                          Rate 1 (lowest) - 5 (highest)
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Criteria
                          </p>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {competency.criteria.map((criterion) => (
                              <li
                                key={`${competency.id}-${criterion.rating}`}
                                className="flex space-x-2"
                              >
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {criterion.rating}.
                                </span>
                                <span>{criterion.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Select Rating
                            </p>
                            <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                                  key={`${competency.id}-${rating}`}
                          type="button"
                          onClick={() =>
                                    setCompetencyRatings((prev) => ({
                                      ...prev,
                                      [competency.id]: {
                                        ...prev[competency.id],
                                        rating,
                                      },
                                    }))
                          }
                          className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                    state.rating === rating
                                      ? "border-purple-600 bg-purple-600 text-white"
                                      : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-purple-400"
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                          </div>
                    </div>

                      <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Remarks
                            </p>
                        <textarea
                              value={state.remarks}
                              onChange={(e) =>
                                setCompetencyRatings((prev) => ({
                                  ...prev,
                                  [competency.id]: {
                                    ...prev[competency.id],
                                    remarks: e.target.value,
                                  },
                                }))
                              }
                          rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                              placeholder="Enter remarks for this competency..."
                        />
                      </div>
                      </div>
                      </div>
                    </div>
                  );
                })}
                      </div>
                    </div>

            {/* Form Actions */}
            <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                onClick={() => setShowEvaluationForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExportOfficialForm}
                        disabled={
                          !Object.values(competencyRatings).every(
                            (entry) => entry.rating > 0
                          )
                        }
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-purple-600 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-5 h-5" />
                        <span>Export Official Form</span>
                      </button>
                      <button
                        onClick={handleSubmitEvaluation}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Evaluation</span>
                  </>
                )}
                        </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SupervisorEvaluation;

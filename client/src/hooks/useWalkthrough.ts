import { useEffect, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export type WalkthroughRole = 'student' | 'instructor' | 'coordinator' | 'supervisor';

export const useWalkthrough = (role: WalkthroughRole) => {
    const driverObj = useRef<ReturnType<typeof driver> | null>(null);

    useEffect(() => {
        let steps: DriveStep[] = [];

        // Common Sidebar Step
        const sidebarStep: DriveStep = {
            element: '#tour-sidebar',
            popover: {
                title: 'Navigation Sidebar',
                description: 'Use this sidebar to navigate through the portal.',
                side: 'right',
                align: 'start',
            }
        };

        // Common User Menu Step
        const userMenuStep: DriveStep = {
            element: '#tour-user-menu',
            popover: {
                title: 'Profile & Settings',
                description: 'Manage your profile and settings here.',
                side: 'top',
                align: 'end',
            }
        };

        switch (role) {
            case 'student':
                steps = [
                    sidebarStep,
                    { element: '#tour-nav-dashboard', popover: { title: 'Overview', description: 'View your internship progress and status.' } },
                    { element: '#tour-nav-documents', popover: { title: 'Documents', description: 'Upload and manage your internship requirements.' } },
                    { element: '#tour-nav-companies', popover: { title: 'Companies', description: 'Browse partner companies.' } },
                    { element: '#tour-nav-partnership-assistance', popover: { title: 'Find Company', description: 'Apply for internships here.' } },
                    { element: '#tour-nav-attendance', popover: { title: 'Attendance', description: 'Track your daily time logs.' } },
                    { element: '#tour-nav-evaluations', popover: { title: 'Evaluations', description: 'View your performance evaluations.' } },
                    userMenuStep
                ];
                break;
            case 'instructor':
                steps = [
                    sidebarStep,
                    { element: '#tour-nav-dashboard', popover: { title: 'Dashboard', description: 'Overview of your assigned students.' } },
                    { element: '#tour-nav-documents', popover: { title: 'Student Documents', description: 'Review and approve student submissions.' } },
                    { element: '#tour-nav-students', popover: { title: 'Students', description: 'Manage, monitor, and track your students.' } },
                    { element: '#tour-nav-reports', popover: { title: 'Reports', description: 'Generate performance reports.' } },
                    userMenuStep
                ];
                break;
            case 'coordinator':
                steps = [
                    sidebarStep,
                    { element: '#tour-nav-dashboard', popover: { title: 'Dashboard', description: 'Program-wide overview.' } },
                    { element: '#tour-nav-students', popover: { title: 'Students', description: 'Manage all students in the program.' } },
                    { element: '#tour-nav-documents', popover: { title: 'Documents', description: 'Manage document templates and submissions.' } },
                    { element: '#tour-nav-companies', popover: { title: 'Companies', description: 'Manage partner companies.' } },
                    { element: '#tour-nav-announcements', popover: { title: 'Announcements', description: 'Post updates for students.' } },
                    userMenuStep
                ];
                break;
            case 'supervisor':
                steps = [
                    sidebarStep,
                    { element: '#tour-nav-dashboard', popover: { title: 'Dashboard', description: 'Overview of interns in your company.' } },
                    { element: '#tour-nav-attendance', popover: { title: 'Attendance', description: 'Approve or review intern attendance.' } },
                    { element: '#tour-nav-evaluations', popover: { title: 'Evaluations', description: 'Submit performance evaluations.' } },
                    { element: '#tour-nav-documents', popover: { title: 'Documents', description: 'Review relevant documents.' } },
                    userMenuStep
                ];
                break;
        }

        driverObj.current = driver({
            showProgress: true,
            animate: true,
            steps: steps,
            onHighlightStarted: (element) => {
                // Ensure sidebar is open on mobile if the target is within the sidebar
                if (window.innerWidth < 1024 && element) {
                    const sidebar = document.getElementById('tour-sidebar');
                    // Check if the element is the sidebar or inside it
                    if (sidebar && (element.id === 'tour-sidebar' || sidebar.contains(element))) {
                        // Check if sidebar is currently closed (has -translate-x-full class)
                        if (sidebar.classList.contains('-translate-x-full')) {
                            const toggle = document.getElementById('mobile-menu-toggle');
                            if (toggle) toggle.click();
                        }
                    }
                }
            },
            onDestroyed: () => {
                localStorage.setItem(`hasSeenWalkthrough_${role}`, 'true');
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/46b30d57-8d19-4b14-963d-edda67b1b958',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'walkthrough-once-only',hypothesisId:'H2',location:'useWalkthrough.ts:onDestroyed',message:'Walkthrough completed and marked as seen',data:{role,key:`hasSeenWalkthrough_${role}`,seenValue:'true'},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            }
        });
    }, [role]);

    const startWalkthrough = () => {
        const hasSeen = localStorage.getItem(`hasSeenWalkthrough_${role}`);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/46b30d57-8d19-4b14-963d-edda67b1b958',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'walkthrough-once-only',hypothesisId:'H1',location:'useWalkthrough.ts:startWalkthrough',message:'Walkthrough start decision',data:{role,key:`hasSeenWalkthrough_${role}`,hasSeen:!!hasSeen},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        // Show the walkthrough only once — ever. Mark as seen immediately.
        if (!hasSeen) {
            localStorage.setItem(`hasSeenWalkthrough_${role}`, 'true');
            // Slight delay to ensure DOM is ready, especially on mobile
            setTimeout(() => {
                driverObj.current?.drive();
            }, 500);
        }
    };

    const resetWalkthrough = () => {
        localStorage.removeItem(`hasSeenWalkthrough_${role}`);
        driverObj.current?.drive();
    }

    return { startWalkthrough, resetWalkthrough };
};

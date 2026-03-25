import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc, getDocs, query, limit } from 'firebase/firestore';

export const seedDemoData = async () => {
  try {
    // 1. Seed Jobs
    const jobsRef = collection(db, 'jobs');
    const jobsSnapshot = await getDocs(query(jobsRef, limit(1)));
    if (jobsSnapshot.empty) {
      const jobs = [
        { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', description: 'We are looking for a React expert to lead our core UI team.', status: 'Open', postedDate: new Date().toISOString() },
        { title: 'Product Manager', department: 'Product', location: 'New York, NY', description: 'Drive the vision and execution of our HCM platform.', status: 'Open', postedDate: new Date().toISOString() },
        { title: 'HR Operations Specialist', department: 'Human Resources', location: 'London, UK', description: 'Manage day-to-day HR operations and employee relations.', status: 'Open', postedDate: new Date().toISOString() },
      ];
      for (const job of jobs) {
        await addDoc(jobsRef, job);
      }
    }

    // 2. Seed Employees (Users)
    const usersRef = collection(db, 'users');
    const employees = [
      { uid: 'emp_1', name: 'Sarah Jenkins', email: 'sarah.j@example.com', role: 'EMPLOYEE', department: 'Engineering', status: 'Active', joiningDate: '2024-01-10', salary: 6500, onboardingCompleted: true, leaveBalance: { sick: 5, casual: 10, unpaid: 0 } },
      { uid: 'emp_2', name: 'Michael Ross', email: 'm.ross@example.com', role: 'EMPLOYEE', department: 'Design', status: 'Active', joiningDate: '2024-03-15', salary: 5800, onboardingCompleted: true, leaveBalance: { sick: 2, casual: 8, unpaid: 1 } },
      { uid: 'emp_3', name: 'Elena Rodriguez', email: 'elena.r@example.com', role: 'DEPT_HEAD', department: 'Engineering', status: 'Active', joiningDate: '2023-11-20', salary: 8500, onboardingCompleted: true, leaveBalance: { sick: 8, casual: 12, unpaid: 0 } },
    ];

    for (const emp of employees) {
      await setDoc(doc(db, 'users', emp.uid), emp);
    }

    // 3. Seed Leave Requests
    const leavesRef = collection(db, 'leaves');
    const leavesSnapshot = await getDocs(query(leavesRef, limit(1)));
    if (leavesSnapshot.empty) {
      const leaves = [
        { employeeId: 'emp_1', employeeName: 'Sarah Jenkins', type: 'Sick', startDate: '2026-03-20', endDate: '2026-03-22', status: 'Pending', reason: 'Flu symptoms', createdAt: serverTimestamp() },
        { employeeId: 'emp_2', employeeName: 'Michael Ross', type: 'Casual', startDate: '2026-03-25', endDate: '2026-03-26', status: 'Approved', reason: 'Family event', createdAt: serverTimestamp() },
      ];
      for (const leave of leaves) {
        await addDoc(leavesRef, leave);
      }
    }

    // 4. Seed Applications
    const appsRef = collection(db, 'applications');
    const appsSnapshot = await getDocs(query(appsRef, limit(1)));
    if (appsSnapshot.empty) {
      const apps = [
        { candidateId: 'cand_1', name: 'David Miller', email: 'david.m@example.com', jobTitle: 'Senior Frontend Engineer', status: 'Shortlisted', appliedDate: new Date().toISOString(), linkedin: 'https://linkedin.com/in/davidm' },
        { candidateId: 'cand_2', name: 'Sophie Turner', email: 'sophie.t@example.com', jobTitle: 'Product Manager', status: 'Applied', appliedDate: new Date().toISOString(), linkedin: 'https://linkedin.com/in/sophiet' },
      ];
      for (const app of apps) {
        await addDoc(appsRef, app);
      }
    }

    // 5. Seed Goals
    const goalsRef = collection(db, 'goals');
    const goalsSnapshot = await getDocs(query(goalsRef, limit(1)));
    if (goalsSnapshot.empty) {
      const goals = [
        { employeeId: 'emp_1', title: 'Complete Frontend Migration', weight: 40, score: 4.5, createdAt: new Date().toISOString() },
        { employeeId: 'emp_1', title: 'Mentor Junior Developers', weight: 30, score: 4.2, createdAt: new Date().toISOString() },
        { employeeId: 'emp_1', title: 'Optimize Build Pipeline', weight: 30, score: 3.8, createdAt: new Date().toISOString() },
      ];
      for (const goal of goals) {
        await addDoc(goalsRef, goal);
      }
    }

    return true;
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
};

import { db } from './firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

export const seedDatabase = async () => {
  const batch = writeBatch(db);

  // 1. Dummy Jobs
  const jobs = [
    {
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Remote / New York',
      type: 'Full-time',
      salary: '$140k - $180k',
      description: 'We are looking for a React expert to lead our dashboard team.',
      status: 'Open',
      postedDate: '2026-03-10',
    },
    {
      title: 'HR Operations Manager',
      department: 'Human Resources',
      location: 'London, UK',
      type: 'Full-time',
      salary: '£55k - £70k',
      description: 'Manage day-to-day HR operations and employee relations.',
      status: 'Open',
      postedDate: '2026-03-12',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'San Francisco',
      type: 'Contract',
      salary: '$80 - $120 / hr',
      description: 'Help us redefine the enterprise HR experience.',
      status: 'Open',
      postedDate: '2026-03-14',
    },
    {
      title: 'Backend Developer (Go)',
      department: 'Engineering',
      location: 'Berlin, Germany',
      type: 'Full-time',
      salary: '€70k - €90k',
      description: 'Build scalable microservices using Go and PostgreSQL.',
      status: 'Open',
      postedDate: '2026-03-15',
    }
  ];

  jobs.forEach((job) => {
    const jobRef = doc(collection(db, 'jobs'));
    batch.set(jobRef, { ...job, createdAt: serverTimestamp() });
  });

  // 2. Dummy Users (Note: These won't have Auth accounts, but will show in directory)
  const dummyUsers = [
    {
      uid: 'dummy-hr-1',
      name: 'Sarah Jenkins',
      email: 'sarah.j@optimahr.com',
      role: 'HR_ADMIN',
      jobTitle: 'Chief People Officer',
      department: 'Human Resources',
      status: 'Active',
      joiningDate: '2023-01-10',
      onboardingCompleted: true,
    },
    {
      uid: 'dummy-dept-1',
      name: 'Michael Chen',
      email: 'm.chen@optimahr.com',
      role: 'DEPT_HEAD',
      jobTitle: 'VP of Engineering',
      department: 'Engineering',
      status: 'Active',
      joiningDate: '2023-05-22',
      onboardingCompleted: true,
    },
    {
      uid: 'dummy-emp-1',
      name: 'Alex Rivera',
      email: 'alex.r@optimahr.com',
      role: 'EMPLOYEE',
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      status: 'Active',
      joiningDate: '2024-02-15',
      onboardingCompleted: true,
      leaveBalance: { sick: 10, casual: 12, unpaid: 0 }
    },
    {
      uid: 'dummy-emp-2',
      name: 'Elena Gilbert',
      email: 'elena.g@optimahr.com',
      role: 'EMPLOYEE',
      jobTitle: 'UX Researcher',
      department: 'Design',
      status: 'Active',
      joiningDate: '2024-06-01',
      onboardingCompleted: true,
      leaveBalance: { sick: 8, casual: 15, unpaid: 0 }
    },
    {
      uid: 'dummy-cand-1',
      name: 'Tom Holland',
      email: 'tom.h@gmail.com',
      role: 'CANDIDATE',
      status: 'Active',
      createdAt: serverTimestamp(),
      onboardingCompleted: false,
    }
  ];

  dummyUsers.forEach((user) => {
    const userRef = doc(db, 'users', user.uid);
    batch.set(userRef, { ...user, createdAt: serverTimestamp() });
  });

  // 3. Default Settings
  const orgSettingsRef = doc(db, 'settings', 'organization');
  batch.set(orgSettingsRef, {
    companyName: 'OptimaHR Solutions',
    registrationNumber: 'REG-12345678',
    headquartersAddress: '123 Enterprise Way, Tech City, State, Country - 101010',
    updatedAt: serverTimestamp(),
  });

  const payrollSettingsRef = doc(db, 'settings', 'payroll');
  batch.set(payrollSettingsRef, {
    incomeTax: '10%',
    providentFund: '12%',
    professionalTax: '$20',
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  console.log('Database seeded successfully!');
};

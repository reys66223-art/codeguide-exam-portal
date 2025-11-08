import { db } from './index';
import { user } from './schema/auth';
import { exams, questions, participants } from './schema/exam';
import { generateExamCode, generateParticipantPassword } from '../lib/exam-codes';

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    try {
        // Create a sample teacher user
        const teacherResult = await db.insert(user).values({
            name: 'John Doe',
            email: 'john.doe@school.edu',
            role: 'teacher',
            school: 'Sample High School',
        }).returning({ id: user.id, email: user.email });

        console.log('✅ Created teacher:', teacherResult[0]);

        // Create a sample exam
        const examCode = generateExamCode();
        const examResult = await db.insert(exams).values({
            title: 'Mathematics Final Exam',
            description: 'Comprehensive mathematics exam covering algebra, geometry, and statistics',
            duration: 120, // 2 hours
            code: examCode,
            createdBy: teacherResult[0].id,
            isActive: true,
            allowReview: true,
            showResultsImmediately: true,
            questionDisplayMode: 'one_by_one',
            shuffleQuestions: false,
            shuffleOptions: false,
        }).returning({ id: exams.id, code: exams.code });

        console.log('✅ Created exam:', examResult[0]);

        // Create sample questions
        const question1Result = await db.insert(questions).values({
            examId: examResult[0].id,
            type: 'multiple_choice',
            content: 'What is the value of x in the equation 2x + 5 = 15?',
            points: 10,
            order: 1,
            options: JSON.stringify([
                { id: 'A', text: 'x = 5' },
                { id: 'B', text: 'x = 10' },
                { id: 'C', text: 'x = 15' },
                { id: 'D', text: 'x = 20' }
            ]),
            correctAnswer: 'A',
            explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5',
        }).returning({ id: questions.id });

        const question2Result = await db.insert(questions).values({
            examId: examResult[0].id,
            type: 'multiple_choice',
            content: 'What is the area of a circle with radius 5 units?',
            points: 10,
            order: 2,
            options: JSON.stringify([
                { id: 'A', text: '25π square units' },
                { id: 'B', text: '10π square units' },
                { id: 'C', text: '5π square units' },
                { id: 'D', text: '50π square units' }
            ]),
            correctAnswer: 'A',
            explanation: 'Area = πr² = π(5)² = 25π',
        }).returning({ id: questions.id });

        const question3Result = await db.insert(questions).values({
            examId: examResult[0].id,
            type: 'essay',
            content: 'Explain the Pythagorean theorem and provide a real-world application where it might be used.',
            points: 20,
            order: 3,
            modelAnswer: 'The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the lengths of the other two sides. This can be written as a² + b² = c², where c is the hypotenuse and a and b are the other two sides. A real-world application is in construction, where builders use this theorem to ensure that corners are perfectly square by measuring the diagonals of a rectangular room or foundation.',
            scoringCriteria: JSON.stringify({
                clarity: 25, // How clearly the student explains the concept
                accuracy: 25, // Mathematical accuracy of the explanation
                example: 25, // Quality and relevance of the real-world example
                completeness: 25 // Whether all parts of the question are addressed
            }),
        }).returning({ id: questions.id });

        console.log('✅ Created 3 sample questions');

        // Create sample participants
        const participantPasswords = [];
        for (let i = 1; i <= 5; i++) {
            const password = generateParticipantPassword();
            participantPasswords.push(password);

            await db.insert(participants).values({
                examId: examResult[0].id,
                name: `Student ${i}`,
                nisnId: `2024${i.toString().padStart(4, '0')}`,
                password: password,
                dateOfBirth: new Date('2005-03-15'),
                isRegistered: true,
                registeredBy: teacherResult[0].id,
            });
        }

        console.log('✅ Created 5 sample participants');
        console.log('\n📝 Participant Login Information:');
        console.log('Exam Code:', examCode);
        console.log('Student Passwords:', participantPasswords.join(', '));
        console.log('\n🎉 Database seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { seedDatabase };
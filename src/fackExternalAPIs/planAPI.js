const CS = {
    1: {
        courses: [
            { courseId: "UNI101", courseName: "Introduction to Computer Science", credits: 3, type: "Compulsory", audience: "University-Wide" },
            { courseId: "CS101", courseName: "Introduction to Computer Science", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS102", courseName: "Programming Fundamentals", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS103", courseName: "Web Development", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "ENG101", courseName: "Calculus for Computer Science", credits: 3, type: "Compulsory", audience: "Faculty-Wide" },
        ],
        labs: [
            { labId: "CS102L", labName: "Programming Fundamentals Lab", credits: 1, courseId: "CS102", audience: "Department-Specific" },
            { labId: "CS103L", labName: "Web Development Lab", credits: 1, courseId: "CS103", audience: "Department-Specific" }
        ]
    },
    2: {
        courses: [
            { courseId: "CS201", courseName: "Data Structures", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS202", courseName: "Operating Systems", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "UNI101", courseName: "Technical Writing", credits: 3, type: "Compulsory", audience: "University-Wide" },
            { courseId: "ENG102", courseName: "Statistics for Computer Science", credits: 3, type: "Compulsory", audience: "Faculty-Wide" },
            {
                electiveSet: "CS509",
                courses: [
                    { courseId: "CS509A", courseName: "Digital Logic Design", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS509B", courseName: "Human-Computer Interaction", credits: 3, audience: "Department-Specific" }
                ]
            }
        ],
        labs: [
            { labId: "CS201L", labName: "Data Structures Lab", credits: 1, courseId: "CS201", audience: "Department-Specific" },
            { labId: "CS202L", labName: "Operating Systems Lab", credits: 1, courseId: "CS202", audience: "Department-Specific" }
        ]
    },
    3: {
        courses: [
            { courseId: "CS301", courseName: "Algorithms", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS302", courseName: "Database Systems", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS303", courseName: "Computer Networks", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "ENG103", courseName: "Discrete Mathematics", credits: 3, type: "Compulsory", audience: "Faculty-Wide" },
            {
                electiveSet: "CS510",
                courses: [
                    { courseId: "CS510A", courseName: "Theory of Computation", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS510B", courseName: "Compiler Design", credits: 3, audience: "Department-Specific" }
                ]
            }
        ],
        labs: [
            { labId: "CS301L", labName: "Algorithms Lab", credits: 1, courseId: "CS301", audience: "Department-Specific" },
            { labId: "CS302L", labName: "Database Systems Lab", credits: 1, courseId: "CS302", audience: "Department-Specific" }
        ]
    },
    4: {
        courses: [
            { courseId: "CS304", courseName: "Software Engineering", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS305", courseName: "Mobile App Development", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "UNI102", courseName: "Professional Communication Skills", credits: 3, type: "Compulsory", audience: "University-Wide" },
            {
                electiveSet: "CS511",
                courses: [
                    { courseId: "CS511A", courseName: "Cybersecurity", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS511B", courseName: "Parallel Computing", credits: 3, audience: "Department-Specific" }
                ]
            }
        ],
        labs: [
            { labId: "CS304L", labName: "Software Engineering Lab", credits: 1, courseId: "CS304", audience: "Department-Specific" },
            { labId: "CS305L", labName: "Mobile App Development Lab", credits: 1, courseId: "CS305", audience: "Department-Specific" }
        ]
    },
    5: {
        courses: [
            { courseId: "CS401", courseName: "Machine Learning", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS402", courseName: "Artificial Intelligence", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            { courseId: "CS403", courseName: "Cloud Computing", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            {
                electiveSet: "CS512",
                courses: [
                    { courseId: "CS512A", courseName: "Cloud Architecture", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS512B", courseName: "Natural Language Processing", credits: 3, audience: "Department-Specific" }
                ]
            }
        ],
        labs: [
            { labId: "CS401L", labName: "Machine Learning Lab", credits: 1, courseId: "CS401", audience: "Department-Specific" },
            { labId: "CS402L", labName: "AI Lab", credits: 1, courseId: "CS402", audience: "Department-Specific" }
        ]
    },
    6: {
        courses: [
            { courseId: "CS404", courseName: "Data Science", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            {
                electiveSet: "CS513",
                courses: [
                    { courseId: "CS513A", courseName: "Big Data Analytics", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS513B", courseName: "Internet of Things (IoT)", credits: 3, audience: "Department-Specific" }
                ]
            },
            {
                electiveSet: "CS514",
                courses: [
                    { courseId: "CS514A", courseName: "Blockchain Technology", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS514B", courseName: "DevOps and CI/CD", credits: 3, audience: "Department-Specific" }
                ]
            }
        ],
        labs: [
            { labId: "CS404L", labName: "Data Science Lab", credits: 1, courseId: "CS404", audience: "Department-Specific" }
        ]
    },
    7: {
        courses: [
            { courseId: "CAP401", courseName: "Capstone Project I", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            {
                electiveSet: "CS515",
                courses: [
                    { courseId: "CS515A", courseName: "Advanced Machine Learning", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS515B", courseName: "Game Development", credits: 3, audience: "Department-Specific" }
                ]
            },
            {
                electiveSet: "CS516",
                courses: [
                    { courseId: "CS516A", courseName: "Robotics", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS516B", courseName: "Virtual and Augmented Reality", credits: 3, audience: "Department-Specific" }
                ]
            }
        ],
        labs: [
            { labId: "CAP401L", labName: "Capstone Project Lab I", credits: 1, courseId: "CAP401", audience: "Department-Specific" }
        ]
    },
    8: {
        courses: [
            { courseId: "CAP402", courseName: "Capstone Project II", credits: 3, type: "Compulsory", audience: "Department-Specific" },
            {
                electiveSet: "CS517",
                courses: [
                    { courseId: "CS517A", courseName: "Blockchain Technology", credits: 3, audience: "Department-Specific" },
                    { courseId: "CS517B", courseName: "DevOps and CI/CD", credits: 3, audience: "Department-Specific" }
                ]
            }
        ],
        labs: [
            { labId: "CAP402L", labName: "Capstone Project Lab II", credits: 1, courseId: "CAP402", audience: "Department-Specific" }
        ]
    }
}
const plans = { PLAN001 :CS}

function getCoursesbyPlanIdAPI(planId){
    return plans[planId];
}

module.exports = getCoursesbyPlanIdAPI;
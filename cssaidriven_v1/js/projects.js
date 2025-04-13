// Project data structure
const projectsData = {
    "categories": [
        {
            "id": "web-design",
            "title": "Web Design",
            "color": "magenta",
            "image": "https://vandalit.github.io/resources/web-design-placeholder.jpg"
        },
        {
            "id": "development",
            "title": "Development",
            "color": "yellow-green",
            "image": "https://vandalit.github.io/resources/dev-placeholder.jpg"
        },
        {
            "id": "ux-ui",
            "title": "UX/UI Design",
            "color": "blue",
            "image": "https://vandalit.github.io/resources/ux-ui-placeholder.jpg"
        },
        {
            "id": "product-design",
            "title": "Product Design",
            "color": "orange-red",
            "image": "https://vandalit.github.io/resources/product-design-placeholder.jpg"
        },
        {
            "id": "graphic-design",
            "title": "Graphic Design",
            "color": "magenta",
            "image": "https://vandalit.github.io/resources/graphic-design-placeholder.jpg"
        },
        {
            "id": "marketing",
            "title": "Marketing & SEO",
            "color": "orange",
            "image": "https://vandalit.github.io/resources/marketing-placeholder.jpg"
        },
        {
            "id": "case-studies",
            "title": "Case Studies",
            "color": "purple",
            "image": "https://vandalit.github.io/resources/case-studies-placeholder.jpg"
        }
    ],
    "projects": [
        {
            "id": "project-1",
            "title": "E-commerce Website",
            "description": "A fully responsive e-commerce platform with custom CMS",
            "categories": ["web-design", "development"],
            "skills": ["HTML", "CSS", "JavaScript", "Vue", "RoR"],
            "image": "https://vandalit.github.io/resources/project1.jpg",
            "link": "https://example.com",
            "tags": ["#ecommerce", "#responsive", "#vue"]
        },
        // More projects...
    ]
};

// Skills data
const skillsData = [
    { name: "Graphic Design", level: 90, category: "design" },
    { name: "3D Modeling", level: 85, category: "design" },
    { name: "CAD/CAE/CAM", level: 80, category: "industrial" },
    { name: "HTML/CSS", level: 85, category: "web" },
    { name: "JavaScript", level: 75, category: "web" },
    { name: "Vue.js", level: 70, category: "web" },
    { name: "Ruby on Rails", level: 65, category: "web" },
    { name: "UX/UI", level: 80, category: "design" },
    { name: "Multimedia", level: 75, category: "content" },
    { name: "Video Editing", level: 70, category: "content" },
    { name: "SEO/SEM", level: 75, category: "marketing" }
];

// Experience data
const experienceData = [
    {
        title: "Web Designer & Developer",
        company: "Freelance",
        period: "2021 - Present",
        description: "Creating responsive websites and web applications for various clients.",
        skills: ["HTML", "CSS", "JavaScript", "Vue", "UX/UI"]
    },
    {
        title: "Product Designer",
        company: "FabLab",
        period: "2018 - 2021",
        description: "Designed and prototyped various products using digital fabrication tools.",
        skills: ["3D Modeling", "CAD", "CAM", "Prototyping"]
    }
];

// Education data
const educationData = [
    {
        institution: "Industrial Design College",
        degree: "Bachelor in Industrial Design",
        period: "2015 - 2019",
        status: "Stand By",
        description: "Focused on product design, materials, and manufacturing processes."
    },
    {
        institution: "Web Development Bootcamp",
        degree: "Full Stack Developer",
        period: "2020",
        description: "Intensive program covering front-end and back-end development.",
        credentials: "Certificate available upon request"
    }
];
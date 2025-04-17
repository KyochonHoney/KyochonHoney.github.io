const projects = [
    {
        title: "펫토피아",
        image: "linux.jpg",
        id: "project1", // 각 프로젝트를 구별할 고유 ID 추가
        description: "프로젝트 1에 대한 설명입니다."
    },
    {
         title: "프로젝트 1",
        image: "linux.jpg",
        id: "project1", // 각 프로젝트를 구별할 고유 ID 추가
        description: "프로젝트 1에 대한 설명입니다."
    },
    {
        title: "프로젝트 2",
        image: "image2.jpg",
        id: "project2", // 각 프로젝트를 구별할 고유 ID 추가
        description: "프로젝트 2에 대한 설명입니다."
    },
    // 더 많은 프로젝트 추가 가능
];

const projectList = document.getElementById('project-list');

projects.forEach(project => {
    const projectItem = document.createElement('div');
    projectItem.classList.add('project-item');
    projectItem.innerHTML = `
        <img src="${project.image}" alt="${project.title}">
        <h3>${project.title}</h3>
    `;
    projectItem.addEventListener('click', () => {
        window.location.href = `project.html?id=${project.id}`;
    });
    projectList.appendChild(projectItem);
});

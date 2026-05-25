# TECHNO-VOC: Technical-Vocational Course Assessment and Ranking System
## CHAPTER III: METHODOLOGY & SYSTEM DEVELOPMENT LIFE CYCLE

---

### Phase 3. Develop (Sprint Cycles)

The system was developed incrementally through a series of sprint cycles using an Agile development approach. Each sprint focused on specific system features, including database setup, role-based authentication, student record management, assessment question banking, automated score ranking, and automated SMS reporting. Continuous integration, coding, and refinements were performed during this phase.

A critical part of the development phase was the implementation of the student assessment portal and automated ranking algorithm. During this stage, the researchers integrated Supabase cloud storage and PostgreSQL triggers into the web application, enabling the system to capture test submissions in real-time and automatically categorize students into specific vocational course strands based on their score rankings and the preset strand capacities. This feature was carefully designed to ensure accurate scores validation, protection of student identity (LRN verification), and correct allocation to TVE strands like Automotive, Agriculture, Beauty Care, Carpentry, Food Technology, and ICT. Subsequent sprints focused on the development of the admin ranking dashboard and the SMS broadcasting notifications module. The system was designed to store ranking logs in real-time and generate reports that could be accessed and printed by instructors and administrators. These reports were structured to provide clear, organized, and reliable enrollment information for academic decision-making.

Throughout the sprint cycles, continuous testing and debugging were conducted to identify and resolve software errors. Feedback from developers and pilot testing was used to refine system functionalities, improve database query performance, and enhance front-end response times. Minor adjustments to the user interface (UI) were also made to ensure accessibility and responsive layout design.

#### Sprint 1: Database Setup and Core Authentication (Student & Admin Login)
During Sprint 1, the development team focused on establishing the backend database architecture in Supabase and implementing core security and authentication layers. The Supabase cloud PostgreSQL tables were created for students, assessments, course strands, and SMS notifications. On the front-end, developers built the unified authentication interface: `LoginPage.tsx` for student registration and login, and `AdminLoginPage.tsx` for educational administrators and TVE coordinators. This sprint incorporated the password visibility toggles, complexity validators, and real-time password strength indicators to ensure the security of student credentials, particularly their Learner Reference Numbers (LRNs).

#### Sprint 2: Student Assessment Delivery Engine & Question Bank Management
Sprint 2 centered on the student assessment flow. The team developed `Assessmentintro.tsx` to orient student applicants about the examination rules and the interactive assessment dashboard `AssessmentQuestion.tsx`. This dynamically pulls multi-category pre-skilled and aptitude questions from Supabase, tracks exam durations with a reactive countdown timer, handles progress auto-saving on connection drops, and routes students to `StudentResults.tsx` upon completion to view immediate score metrics. Concurrently, the team created `EditQuestionModal.tsx`, giving coordinators an intuitive database tool to insert, update, and categorize vocational questions by category and strand difficulty.

#### Sprint 3: Administrative Control Center, Course Capacities & Rankings Engine
In Sprint 3, the administrative backend and core placement algorithm were built. The developers implemented `AdminDashboard.tsx` as the core control panel, utilizing modular tabs: `OverviewTab.tsx` for statistical analytics and `CoursesTab.tsx` for updating strand-level capacity thresholds. The heart of this sprint was `RankingsTab.tsx`, which calculates student placement ranks in real-time based on assessment performance. The algorithm automatically categorizes applicants as 'Included' (within capacity limits) or 'Waitlisted' (capacity exceeded). Interactive features were supported by `StudentDetailModal.tsx` and `CourseStudentsModal.tsx` to allow administrators to review individual student profiles and manage enrollment listings.

#### Sprint 4: SMS Notification Broadcasting, Printing Engine, and Final Integration
The final sprint focused on automated communications and reporting tools. The team implemented `SMSTab.tsx` to integrate SMS gateway protocols (such as Semaphore or Twilio), allowing coordinators to broadcast bulk placement notifications to students' contact numbers with a single click. Concurrently, the `printResults.ts` printing engine was built, allowing the school to output official PDF results and enrollment summary listings. Developers concluded Sprint 4 with system-wide integration audits, fixing styling layouts in `App.css` and `index.css`, optimizing database queries, and validating Supabase connection persistence.

The use of sprint cycles allowed the researchers to systematically develop the system in manageable phases, ensuring that each component was fully functional before proceeding to the next. This iterative process contributed to the development of a highly reliable, efficient, and user-centered **TECHNO-VOC Assessment and Ranking System**.

---

### Phase 4. Testing

During the testing phase, the **TECHNO-VOC: Technical-Vocational Course Assessment and Ranking System** undergoes a series of systematic evaluations to ensure that all functionalities operate correctly and meet the specified academic and technical requirements. This phase focuses on identifying programming errors, validating system performance, and ensuring that the web-based application is reliable, secure, and user-friendly for both student test-takers and Technical-Vocational Education (TVE) administrators.

The testing process begins with **functional testing**, where each module of the system is examined individually. Core features such as LRN-based user authentication, student registration, TVE strand assessment delivery, question bank management (incorporating pre-skilled and aptitude question types), course capacity constraints, automated student rankings computation, and automated SMS notifications are tested to verify that they perform according to the intended design. Each function is checked for calculation accuracy, database consistency, and proper integration with other system components.

Following this, **integration testing** is conducted to ensure that the different modules of the system work seamlessly together. Specifically, the interaction between the React/Vite frontend interface and the Supabase cloud database is tested. This confirms that whenever a student submits an exam, their scores are correctly captured, passing rates are validated in real-time, the course placement ranking is updated (categorizing students as "included" or "waitlisted" based on course capacities), and SMS notifications are broadcasted automatically. This step ensures that data flows properly across the system without data loss, integrity errors, or network delays.

The system also undergoes **usability testing**, where selected users, such as vocational student applicants and TVE instructors, interact with the application to evaluate its ease of use, interface clarity, and overall user experience. Feedback gathered during this stage helps identify areas for improvement, particularly in assessment navigation, question layouts, readability of the screen, and admin dashboard accessibility.

In addition, **performance testing** is carried out to assess how the system behaves under normal and peak usage conditions. The application is evaluated based on its page response time, question loading speed, and ability to handle multiple students taking assessments simultaneously. This ensures that the server remains stable and efficient during actual school screening periods.

**Security testing** is also considered through authentication and access control evaluation, ensuring that only authorized instructors and administrators can access administrative settings, edit questions, or manage student rankings, while sensitive data such as student LRNs, phone numbers, and test scores are protected from unauthorized access.

Finally, the system is evaluated using the **ISO/IEC 25010 Software Quality Model**, focusing on key characteristics such as *functional suitability, usability, reliability, performance efficiency, and security*. The results of this evaluation provide a comprehensive assessment of the system's quality and acceptability.

The testing phase ensures that the **TECHNO-VOC Assessment and Ranking System** operates as intended, meets user expectations, and is ready for full deployment in the TVE Department.

---

### Phase 5. Review

The review phase is an essential part of the system development process, as it allows the researchers to assess the overall performance, quality, and effectiveness of the **TECHNO-VOC Assessment and Ranking System** after development and testing. This phase focuses on evaluating whether the system meets the specified requirements, achieves the objectives of the study, and satisfies the needs of its intended users.

During this phase, the researchers conducted a comprehensive review of the system by analyzing the results gathered from the testing activities, particularly the user acceptance testing. Feedback from respondents, including students and instructors, was carefully examined to identify strengths, weaknesses, and areas for improvement. The evaluation was guided by the **ISO/IEC 25010 Software Quality Model**, which provided a structured framework for assessing key characteristics such as functional suitability, usability, reliability, performance efficiency, and security.

The review process also involves verifying the consistency between the system design and the actual implementation. The researchers ensure that all planned features, including LRN-based authentication, TVE course assessments, real-time database updating, automated rankings calculations, and SMS notification broadcasting, were successfully implemented and functioning as intended. Any discrepancies or issues identified during this phase were documented and addressed through minor revisions and system refinements.

In addition, the researchers evaluated the overall user experience by considering factors such as ease of navigation, clarity of the assessment interface, and responsiveness of the admin dashboard. This helped ensure that the application is user-friendly and accessible to its intended users. The effectiveness of the system in reducing manual workload, minimizing errors in rankings computation, and improving TVE enrollment monitoring efficiency was also assessed.

The review phase provides a final validation of the **TECHNO-VOC Assessment and Ranking System**. It ensured that the system meets acceptable quality standards and is ready for implementation within the Technical-Vocational Education (TVE) department of the Northern Antique Vocational School. The insights gained from this phase also serve as a basis for future enhancements and continuous improvement of the system.

---

### Phase 6. Deploy

In the deployment phase, the **TECHNO-VOC Assessment and Ranking System** will be implemented within the Technical-Vocational Education (TVE) Department of the Northern Antique Vocational School (NAVS). This phase will involve making the system available to its intended users, including TVE coordinators, instructors, and student applicants, for actual use in assessment administration and enrollment rankings.

Prior to full deployment, the system will undergo final preparation, which will include configuring the production environment, setting up the Supabase cloud database, and ensuring that the frontend Vite/React application is deployed onto a stable hosting platform. The application access credentials will be distributed to authorized administrators, and student registration links will be shared with applicants.

> **IMPORTANT ARCHITECTURAL ANCHORING DIRECTIVE:**
> The selection of the deployment structure or system architecture type must be properly anchored on existing studies, literature, or established practices. Researchers are expected to support their chosen deployment model, whether client-server, three-tier, cloud-based, or hybrid, with relevant references from previous studies or credible sources. 
> 
> This ensures that the chosen architecture is not only appropriate for the system but also academically justified and grounded in existing knowledge. The discussion should clearly cite related works or literature that have implemented or recommended similar deployment structures for comparable systems (specifically emphasizing lightweight serverless architectures or cloud-integrated relational databases like Supabase/PostgreSQL for student monitoring and screening dashboards).

The researchers will also conduct user orientation and training sessions to familiarize users with the system’s features and operations. These sessions will ensure that TVE coordinators and administrators can manage academic data effectively, instructors can monitor student exam rankings and dispatch SMS alerts, and students can properly use the online testing platform to complete their assessments.

During the initial implementation, the system will be closely monitored to identify any technical issues or user related concerns. Necessary adjustments and minor improvements will be made to enhance system performance and usability. Technical support will also be provided to assist users in resolving any difficulties encountered during the early stages of deployment.

Furthermore, the system will be evaluated in a real-world setting to determine its effectiveness in improving the vocational placement screening process. Feedback from users will be collected and analyzed to assess system performance and identify opportunities for further enhancement.

The deployment phase will mark the transition of the **TECHNO-VOC Assessment and Ranking System** from development to actual operation. It will ensure that the system is properly introduced, effectively utilized, and capable of delivering its intended benefits in improving efficiency, accuracy, and reliability in TVE course placement.

---

### Locale of the Study

The study is conducted at the **Northern Antique Vocational School (NAVS)** in Antique, Philippines. This institution serves as the primary setting for the development, implementation, and evaluation of the proposed **TECHNO-VOC Assessment and Ranking System**.

Northern Antique Vocational School offers various Technical-Vocational-Livelihood (TVL) courses and training programs, making it an appropriate environment for conducting a system-based research study. The existing student course placement and screening process within the TVE department relies on manual screening methods, paper-based forms, and spreadsheets, which are observed to be time-consuming, prone to calculation errors, and inefficient in handling large volumes of student application data. The selection of this locale is significant because it directly reflects the problem addressed in the study. The need for an automated and technology-driven placement and ranking system is evident within the school, where instructors handle hundreds of student applicants across multiple strands like Automotive, Agriculture, Beauty Care, Carpentry, Dressmaking, Drafting, Electricity, Electronics, Food Technology, ICT, and SMAW. The availability of users, such as faculty members and vocational applicants, also supports the data gathering and system evaluation processes required in the study.

Furthermore, the technological environment of the Northern Antique Vocational School, including access to computers, smartphones, and internet connectivity, makes it suitable for implementing a web-based course assessment and automated placement ranking platform. This allows the researchers to test the feasibility and effectiveness of the proposed application in a real academic setting.

---

### Respondents of the Study

The respondents of the study consist of selected students, TVE instructors/coordinators, and IT experts from the **Northern Antique Vocational School (NAVS)**. These respondents are chosen because they are the primary users, administrators, and technical evaluators of the proposed **TECHNO-VOC Assessment and Ranking System**.

The student respondents represent the end users of the system, as they will utilize the student portal to register, log in, and complete the TVE course assessment. Their participation is essential in evaluating the usability, efficiency, and convenience of the system, particularly in terms of ease of use and interaction with the digital testing and course placement interface.

On the other hand, the faculty members, specifically TVE instructors and coordinators, serve as respondents because they are responsible for managing the assessment question bank, setting course capacities, monitoring student rankings in real-time, and broadcasting SMS notifications. Their feedback is important in assessing the system’s functionality, accuracy, and usefulness in supporting administrative and placement-related tasks.

Lastly, IT experts are included as respondents to provide a professional, technical assessment of the system's software architecture, database integrity, and overall performance. The respondents are selected based on their direct involvement in the current TVE enrollment process and their potential interaction with the proposed system. Their responses are used to evaluate the system using the ISO/IEC 25010 Software Quality Model, focusing on aspects such as functional suitability, usability, reliability, performance efficiency, and security.

#### Table 7. Profile of the Respondents by Category

| Category | f (Frequency) | % (Percentage) |
| :--- | :---: | :---: |
| Students | 15 | 37.5% |
| Instructors | 10 | 25.0% |
| IT Experts | 15 | 37.5% |
| **Total** | **40** | **100.0%** |

Table 7 shows the distribution of respondents involved in the study, composed of students, instructors, and IT experts. Students comprise the largest user group evaluating the system’s front-end and assessment flow, while instructors evaluate its administrative effectiveness in course placement and notification. IT experts are included to provide technical assessment of the system’s design, security, and performance. The total of 40 respondents ensures sufficient, structured data for a reliable evaluation of the **TECHNO-VOC Assessment and Ranking System**.

---

### Sampling Technique

The study employs a **purposive sampling technique** in selecting the respondents. This method involves deliberately choosing participants who have direct involvement and experience with the student screening and enrollment process and are most relevant to the objectives of the study.

The respondents include selected students, instructors, and IT experts from the TVE Department at Northern Antique Vocational School, as they are the primary users and evaluators of the proposed **TECHNO-VOC Assessment and Ranking System**. Students are chosen based on their participation in the TVE enrollment and course assessment process, while instructors are selected due to their responsibility in student screening, questionnaire management, and enrollment decision-making. Purposive sampling is appropriate for this study because it focuses on individuals who can provide meaningful and reliable feedback regarding the functionality, usability, and effectiveness of the system. By selecting respondents who are directly affected by the existing manual student placement process, the researchers are able to gather accurate insights into the system’s performance and its potential to improve current practices. This sampling technique ensures that the evaluation of the system, particularly using the ISO/IEC 25010 Software Quality Model, is based on informed responses from users who actively interact with the system. This contributes to a more valid and relevant assessment of the proposed application.

---

### Research Instruments

The study utilizes structured research instruments to gather data necessary for evaluating the **TECHNO-VOC Assessment and Ranking System**. These instruments are designed to measure the system’s performance, usability, and overall acceptability among the selected respondents. The primary instrument used in this study is a survey questionnaire, supported by an evaluation framework based on the ISO/IEC 25010 Software Quality Model.

#### Survey Questionnaire
The researchers develop a structured questionnaire to collect responses from students and faculty members who interact with the system. The questionnaire consists of statements related to the system’s functionality, usability, reliability, performance, and security. A Likert scale is used to measure the respondents’ level of agreement, typically ranging from strongly disagree to strongly agree. This allows for quantitative analysis of user feedback.

The questionnaire is designed to be clear and concise to ensure that respondents can easily understand and answer each item. It is also validated prior to distribution to ensure that it accurately measures the intended aspects of the system.

#### Evaluation Instrument Based on ISO/IEC 25010
The evaluation instrument used in this study is structured in a systematic manner to ensure that all relevant aspects of the **TECHNO-VOC Assessment and Ranking System** are assessed comprehensively. It is designed based on the ISO/IEC 25010 Software Quality Model and organized into clearly defined sections that correspond to the selected quality characteristics.

The instrument begins with an introductory section, which provides instructions to the respondents on how to answer the questionnaire. This section explains the purpose of the evaluation and assures respondents that their responses will be treated with confidentiality. It also includes basic information about the respondent, such as their role (student, instructor, or IT expert), which helps in categorizing the responses.

The main body of the instrument is divided into five sections, each representing a specific ISO/IEC 25010 quality characteristic. These sections include functional suitability, usability, reliability, performance efficiency, and security. Each section contains a set of statements that describe specific attributes of the system related to the corresponding quality characteristic.

*   **Under functional suitability**, the statements focus on whether the system performs the required functions accurately and completely, such as LRN-based student authentication, TVE course assessments, automated score rankings computation, course capacity threshold management, and automated SMS notification broadcasting.
*   **The usability section** includes items that assess the ease of use, clarity of the reactive testing interface, visual feedback indicators, and overall administrator dashboard user experience.
*   **The reliability section** evaluates the system’s consistency, data persistence, and ability to process multiple concurrent assessment submissions and calculate rank outputs without errors.
*   **The performance efficiency section** measures page load response time, question retrieval speeds, rankings compilation duration, and SMS gateway dispatch efficiency.
*   **Lastly, the security section** assesses the effectiveness of LRN validation, password-strength validation meters, admin authentication controls, and the secure protection of student profiles and performance scores.

Each statement in the instrument is rated using a Likert scale, typically ranging from 1 to 5, where respondents indicate their level of agreement from strongly disagree to strongly agree. This scale allows for quantitative analysis of the responses and facilitates the computation of mean scores for each quality characteristic.

The instrument may also include an optional comment section, where respondents can provide additional feedback, suggestions, or observations regarding the system. This qualitative input helps the researchers identify areas for improvement beyond the structured questions. 

The research instruments used in this study provide a structured and standardized approach to evaluating the **TECHNO-VOC Assessment and Ranking System**. The combination of a questionnaire and the ISO/IEC 25010 model ensures that the system is assessed comprehensively, covering both technical performance and user satisfaction. This approach enhances the reliability and validity of the evaluation results.

---

### Data Gathering Procedure

The data gathering procedure of the study was conducted in a systematic manner to ensure the accuracy, reliability, and completeness of the collected data. The process consisted of two major stages: requirements analysis and system evaluation.

#### Stage 1: Requirements Analysis
During the requirements analysis phase, the researchers first gathered data to identify the problems and needs associated with the existing manual vocational screening and course placement process. This was done through informal interviews, observations, and consultations with faculty members and students of the TVE department at the Northern Antique Vocational School (NAVS). The researchers examined how vocational screening was currently conducted using paper questionnaires or spreadsheets and identified issues such as excessive time consumption, human calculation errors, and difficulty in communicating results to students. The insights gathered from this stage served as the basis for defining the system requirements, features, and functionalities of the proposed **TECHNO-VOC Assessment and Ranking System**.

#### Stage 2: System Evaluation
Prior to the actual system evaluation, the researchers prepared the necessary materials, including the developed Vite/React system connected to Supabase and the evaluation questionnaire based on the ISO/IEC 25010 Software Quality Model. Permission was then secured from the appropriate authorities of the Northern Antique Vocational School to conduct the study. After approval was obtained, coordination with selected respondents, composed of students, instructors, and IT experts, was carried out.

The respondents were first oriented about the purpose of the study and the functionalities of the system. They were then given access to the **TECHNO-VOC Assessment and Ranking System** and allowed to interact with it. Students registered using their LRNs, navigated the testing platform, and completed their assessments, while TVE instructors explored features such as editing database questions, updating course capacities, monitoring student rankings in real-time, and dispatching SMS notification alerts. IT experts evaluated the system from a technical and architectural perspective.

After using the system, the respondents were asked to answer the evaluation questionnaire. The instrument was distributed either in printed form or through an online platform. The respondents rated the system based on ISO/IEC 25010 criteria, including functional suitability, usability, reliability, performance efficiency, and security. The completed questionnaires were then collected and checked to ensure that all responses were properly recorded.

In the subsequent phase of the study, the collected data will be organized, tabulated, and analyzed using appropriate statistical methods. The researchers will compute the mean and standard deviation for each evaluation criterion to determine the level of acceptability of the system. The results will then be interpreted to identify strengths, weaknesses, and areas for improvement, which will serve as the basis for the conclusions and recommendations of the study.

---

### Statistical Treatment of Data

The statistical treatment of data is used to analyze and interpret the responses gathered from the evaluation questionnaire. In this study, the researchers will use frequency, mean, and standard deviation to measure and describe the respondents’ evaluation of the **TECHNO-VOC Assessment and Ranking System** based on the ISO/IEC 25010 criteria.

**Frequency** is used to determine how often a particular response occurs. It helps in identifying the distribution of responses for each item in the questionnaire. The number of responses for each rating will be counted, and the results will be tabulated to show how many respondents selected each option. This will provide an overview of how respondents perceive each aspect of the system. 

**The mean** is used to determine the average rating of each criterion. It reflects the overall assessment of the system by the respondents.

$$\bar{x} = \frac{\sum x}{n}$$

Where:
*   $\bar{x}$ = computed weighted mean
*   $\sum x$ = sum of all individual response values (Likert value multiplied by its corresponding frequency)
*   $n$ = total number of responses ($n = 40$)

The researchers multiply each Likert scale value by its corresponding frequency, add all the products to get the total score, and divide the total score by the total number of respondents. The computed mean is then interpreted using a predefined scale to determine the level of acceptability.

**Standard deviation** is used to measure the variability or consistency of the responses. It shows how much the responses deviate from the mean.

$$s = \sqrt{\frac{\sum (x - \bar{x})^2}{n - 1}}$$

Where:
*   $s$ = sample standard deviation
*   $x$ = individual response rating
*   $\bar{x}$ = computed weighted mean
*   $n$ = total number of responses ($n = 40$)

To calculate the standard deviation, the mean is subtracted from each response value. Each difference is squared, and then all squared differences are summed. The result is divided by $n - 1$, after which the square root is taken. A low standard deviation indicates that responses are close to the mean (indicating consistent responses and consensus), while a high standard deviation indicates that responses are more spread out (indicating less agreement among respondents).

The use of frequency, mean, and standard deviation provides a comprehensive analysis of the collected data. Frequency shows the distribution of responses, the mean determines the overall evaluation, and the standard deviation measures the consistency of the responses. Together, these statistical tools enable the researchers to accurately assess the performance and acceptability of the **TECHNO-VOC Assessment and Ranking System**.

The data collected from the respondents will be systematically organized, processed, and analyzed to determine the effectiveness and acceptability of the **TECHNO-VOC Assessment and Ranking System**. The responses gathered through the evaluation questionnaire will first be reviewed for completeness and accuracy before proceeding to analysis.

The researchers will encode the data into a suitable format, such as a spreadsheet or statistical software, to facilitate computation. The responses based on the Likert scale will be assigned corresponding numerical values, which will allow quantitative analysis of each item under the different ISO/IEC 25010 quality characteristics.

To analyze the data, the researchers will compute the weighted mean for each criterion to determine the functional suitability, usability, reliability, performance efficiency, and security average rating of the system based on the respondents’ evaluation. The computed mean scores will then be interpreted using a predefined scale to assess the level of acceptability of the system.

#### Table 8. Interpretation of Likert Scale Ratings

| Score | Value Range | Verbal Interpretation | Description |
| :---: | :---: | :--- | :--- |
| **5** | 4.21 – 5.00 | **Highly Acceptable** | The system performs excellently and fully meets requirements. |
| **4** | 3.41 – 4.20 | **Acceptable** | The system performs well and meets most requirements. |
| **3** | 2.61 – 3.40 | **Moderately Acceptable** | The system partially meets requirements. |
| **2** | 1.81 – 2.60 | **Slightly Acceptable** | The system needs significant improvement. |
| **1** | 1.00 – 1.80 | **Not Acceptable** | The system does not meet requirements. |

Table 8 presents the interpretation of the Likert scale used to assess the level of acceptability of the **TECHNO-VOC Assessment and Ranking System**. Each numerical range corresponds to a specific verbal interpretation that describes how acceptable the system is based on the respondents’ evaluation. This allows the researchers to clearly interpret the computed mean scores and determine whether the system meets the required standards in terms of functionality, usability, reliability, performance efficiency, and security.

The results of the evaluation will be presented in tabular form to clearly show the distribution of responses and the computed values for each category. Comparative analysis may also be conducted to identify which aspects of the system perform well and which areas require improvement.

The findings of the data analysis will then be interpreted to draw meaningful conclusions about the system’s performance. These results will serve as the basis for evaluating whether the **TECHNO-VOC Assessment and Ranking System** meets the intended objectives and quality standards. Furthermore, the analysis will support the formulation of recommendations for system enhancement and future development.

---

### Ethical Considerations

The study observes proper ethical standards throughout the development, implementation, and evaluation of the **TECHNO-VOC Assessment and Ranking System**. Ethical considerations are important to ensure that the rights, privacy, and well-being of all participants are protected.

Prior to data collection, the researchers will secure formal approval and permission from the administrative and TVE school authorities of the **Northern Antique Vocational School (NAVS)**. This ensures that the study is conducted with institutional approval and within the guidelines of the school.

The respondents, composed of students, TVE instructors, and IT experts, will be informed about the purpose of the study before their participation. Their involvement will be voluntary, and they will have the right to decline or withdraw from the study at any time without any form of penalty or academic disadvantage. The researchers will also obtain informed consent from the participants, ensuring that they fully understand the nature of their participation.

To protect the privacy of the respondents, all collected data will be treated with strict confidentiality in accordance with the Data Privacy Act (Republic Act No. 10173). Personal information, such as Learner Reference Numbers (LRNs), contact numbers, and names, will not be disclosed in any part of the study. The data gathered will be used solely for academic and research purposes.

In addition, the system itself is designed with data security measures, such as role-based authentication, password strength enforcement, and controlled database access, to prevent unauthorized use of sensitive information. The researchers will ensure that assessment logs, score rankings, and student data are stored securely and accessed only by authorized individuals.

The researchers will also maintain honesty and integrity in presenting the results of the study. Data will not be altered, manipulated, or misrepresented, and all findings will be reported accurately.

These ethical considerations ensure that the study is conducted responsibly, respecting the rights of participants while maintaining the credibility and validity of the research.

import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import img from '../assets/certificate-background.png';
import signatureImg from '../assets/Signiture.png';

const CertificateGenerator = () => {
  const [quiz, setQuiz] = useState([]);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/quizTkn/byUserId/6");
        if (!response.ok) {
          throw new Error("Failed to fetch quiz data");
        }
        const data = await response.json();
        setQuiz(data);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
      }
    };
    loadQuiz();
  }, []);

    // console.log(quiz[0].quiztknID)
  const generateCertificate = async () => {
    console.log(quiz)
    if (!quiz) {
      console.error('Quiz data is not available or incomplete');
      return;
    }

    //Check if the user passed or failed the course to generate the certificate 01/30/2023
    const targetScore = quiz[0].quiz_score;
    const name = quiz[0].users.full_name;
    const instructor = quiz[0].quiz.course.instructor.full_name;
    const course = quiz[0].quiz.course.title;
    const quiztknId = quiz[0].quiztknID;
    const courseid = quiz[0].quiz.course.courseID;


    // Check if the target score is greater than or equal to 80
    const isPass = targetScore >= 80;
    const resultText = isPass ? 'Pass' : 'Failed';
    if (!isPass) {
      console.log('The quiz result is a failure. The certificate will not be generated.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [297, 210],
    });

    doc.addImage(img, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());

    doc.setFontSize(48);
    doc.setTextColor(162, 123, 66);
    doc.setFont('helvetica');
    const recipientNameTextWidth = doc.getStringUnitWidth(name) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const recipientPosition = 70 + (225 - 70) / 2 - recipientNameTextWidth / 2;
    doc.text(name, recipientPosition, 103, { align: 'left' });

    doc.setFontSize(20);
    doc.setTextColor(162, 123, 66);
    const courseTextWidth = doc.getStringUnitWidth(course) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const coursePosition = 140 + (245 - 140) / 2 - courseTextWidth / 2;
    doc.text(course, coursePosition, 117, { align: 'left' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const instructorTextWidth = doc.getStringUnitWidth(instructor) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const centerPosition = 170 + (228 - 170) / 2 - instructorTextWidth / 2;
    doc.text(instructor, centerPosition, 167, { align: 'center' });

    const signatureImgDataUrl = await toDataUrl(signatureImg);
    const signatureWidth = 50;
    const signatureHeight = 50;
    const signatureHorizontalPosition = 140 + (228 - 140) / 2 - signatureWidth / 2;
    doc.addImage(signatureImgDataUrl, 'PNG', signatureHorizontalPosition, 135, signatureWidth, signatureHeight);

    const serialNumber = Math.floor(Math.random() * 1000000);
    doc.setFontSize(11.3);
    doc.setTextColor(0, 0, 0);
    doc.text(`Batch_55-${serialNumber}`, 85, 158, { align: 'left' });
    
    //Date Issued 01/30/2024
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    const cDate = new Date();
   
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDateIssued = cDate.toLocaleDateString(undefined, options);
   
    doc.setFontSize(17);
    doc.text(`${formattedDateIssued}`, 148, 128, { align: 'right' });
   
    doc.setFontSize(10);
    doc.text(formattedDate, 87, 154, { align: 'right' });
    
    //Course ID 01/30/2024
    doc.text(`${courseid}`, 75, 163, { align: 'right' });

    // Save the PDF file to send to the backend 01/29/2024
    const pdfFile = new File([doc.output('blob')], `${name}-${course}.pdf`, { type: 'application/pdf' });

    // Create form data to send the file to the backend 01/29/2024
    const formDataToSend = new FormData();
    formDataToSend.append('serial_no', `Batch_55-${serialNumber}`);
    formDataToSend.append('file', pdfFile);
    formDataToSend.append('date_issued', "2024-01-25");
    formDataToSend.append('criteria', isPass);
    formDataToSend.append('quiztkn_ID', quiztknId);

    // Send the PDF file to the backend 01/28/2024
    fetch('http://localhost:8080/api/certifications', {
      method: 'POST',
      body: formDataToSend,
    })
    .then(response => {
      console.log('Certificate saved:', response);
      // Handle success as needed
    })
    .catch(error => {
      console.error('Error:', error);
      // Handle error as needed
    });
  };

  function toDataUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  return (
    <div>
      {/* Button to generate certificate */}
      <button onClick={generateCertificate}>Generate Certificate</button>
    </div>
  );
};


export default CertificateGenerator;
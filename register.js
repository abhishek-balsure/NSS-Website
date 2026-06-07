const enrollmentForm = document.getElementById('enrollmentForm');

enrollmentForm.addEventListener('submit', function (event) {
    event.preventDefault();
    try {
        let isValid = true;

        document.querySelectorAll('.form-group').forEach(function (g) {
            g.classList.remove('error');
        });

        const requiredFields = [
            'Name', 'ParentName', 'DOB', 'Gender', 'BloodGroup', 'Cast', 'AadharNo',
            'Department', 'AcademicYear', 'Class', 'RollNo', 'Eligibility',
            'Email', 'MobileNo', 'EmergencyNo', 'EmergencyRelation', 'Address',
            'Interest', 'PrevNSS', 'TShirtSize'
        ];

        const formData = {};

        requiredFields.forEach(function (id) {
            const el = document.getElementById(id);
            const val = el.value.trim();
            formData[id] = val;
            if (val === '') {
                el.closest('.form-group').classList.add('error');
                isValid = false;
            }
        });

        // Mobile validation
        if (formData.MobileNo && !/^\d{10}$/.test(formData.MobileNo)) {
            document.getElementById('MobileNo').closest('.form-group').classList.add('error');
            isValid = false;
        }

        // Emergency number validation
        if (formData.EmergencyNo && !/^\d{10}$/.test(formData.EmergencyNo)) {
            document.getElementById('EmergencyNo').closest('.form-group').classList.add('error');
            isValid = false;
        }

        // Aadhar validation
        const aadharClean = formData.AadharNo.replace(/\s/g, '');
        if (!/^\d{12}$/.test(aadharClean)) {
            document.getElementById('AadharNo').closest('.form-group').classList.add('error');
            isValid = false;
        }

        // Email validation
        if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
            document.getElementById('Email').closest('.form-group').classList.add('error');
            isValid = false;
        }

        // Declaration checkbox
        const declCheck = document.getElementById('Declaration');
        if (!declCheck.checked) {
            declCheck.closest('.form-group').classList.add('error');
            isValid = false;
        }

        if (isValid) {
            try {
                formData.Medical = document.getElementById('Medical').value.trim() || 'None';

                // Save to localStorage
                const registrations = JSON.parse(localStorage.getItem('nss_registrations') || '[]');
                formData.timestamp = new Date().toISOString();
                registrations.push(formData);
                localStorage.setItem('nss_registrations', JSON.stringify(registrations));

                // Generate Ref ID & Date
                const refId = 'SRH-NSS-' + formData.AcademicYear.split('-')[0] + '-' + Math.floor(1000 + Math.random() * 9000);
                const formattedDate = new Date().toLocaleDateString('en-IN', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });

                // Format DOB
                const dobFormatted = new Date(formData.DOB).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric'
                });

                // Populate printable form fields
                document.getElementById('pfRefId').textContent        = refId;
                document.getElementById('pfAcadYear').textContent     = formData.AcademicYear;
                document.getElementById('pfDate').textContent         = formattedDate;
                document.getElementById('pfName').textContent         = formData.Name;
                document.getElementById('pfParent').textContent       = formData.ParentName;
                document.getElementById('pfDob').textContent          = dobFormatted;
                document.getElementById('pfGender').textContent       = formData.Gender;
                document.getElementById('pfBlood').textContent        = formData.BloodGroup;
                document.getElementById('pfCaste').textContent        = formData.Cast;
                document.getElementById('pfAadhar').textContent       = aadharClean.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
                document.getElementById('pfDept').textContent         = formData.Department;
                document.getElementById('pfClass').textContent        = formData.Class;
                document.getElementById('pfRoll').textContent         = formData.RollNo;
                document.getElementById('pfEligibility').textContent  = formData.Eligibility;
                document.getElementById('pfEmail').textContent        = formData.Email;
                document.getElementById('pfMobile').textContent       = formData.MobileNo;
                document.getElementById('pfEmergency').textContent    = formData.EmergencyNo + ' (' + formData.EmergencyRelation + ')';
                document.getElementById('pfAddress').textContent      = formData.Address;
                document.getElementById('pfInterest').textContent     = formData.Interest;
                document.getElementById('pfPrevNss').textContent      = formData.PrevNSS;
                document.getElementById('pfTshirt').textContent       = formData.TShirtSize;
                document.getElementById('pfMedical').textContent      = formData.Medical;

                // ── PDF Download ──
                document.getElementById('downloadPdfBtn').onclick = function () {
                    var container = document.getElementById('printFormContainer');
                    var printable = document.getElementById('printableForm');
                    printable.style.display = 'block';

                    if (typeof html2pdf === 'undefined') {
                        alert('PDF library failed to load. Please use the Print button and choose "Save as PDF".');
                        printable.style.display = 'none';
                        return;
                    }

                    var opt = {
                        margin: 0,
                        filename: 'NSS_Enrollment_Form_' + formData.Name.replace(/\s+/g, '_') + '.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };

                    html2pdf().set(opt).from(container).save()
                        .then(function () {
                            printable.style.display = 'none';
                        })
                        .catch(function (err) {
                            console.error('PDF error:', err);
                            alert('PDF generation failed. Please use the Print button instead.');
                            printable.style.display = 'none';
                        });
                };

                // ── Print via Blob URL (no doc.write, no parser risk) ──
                document.getElementById('printFormBtn').onclick = function () {
                    var container = document.getElementById('printFormContainer');
                    var printable = document.getElementById('printableForm');
                    printable.style.display = 'block';

                    // Collect all CSS rules safely
                    var styleContent = '@page { size: A4; margin: 10mm; } body { margin: 0; padding: 0; }';
                    try {
                        Array.from(document.styleSheets).forEach(function (sheet) {
                            try {
                                Array.from(sheet.cssRules).forEach(function (rule) {
                                    styleContent += rule.cssText + '\n';
                                });
                            } catch (e) {
                                // Cross-origin sheet — skip silently
                            }
                        });
                    } catch (e) {
                        console.warn('Could not read stylesheets:', e);
                    }

                    // Build HTML as an array and join — no template literals
                    var parts = [
                        '<!DOCTYPE html>',
                        '<html>',
                        '<head>',
                        '<meta charset="UTF-8">',
                        '<title>NSS Enrollment Form - ' + formData.Name + '</title>',
                        '<style>',
                        styleContent,
                        '.printable-form { display: block !important; }',
                        '</style>',
                        '</head>',
                        '<body>',
                        '<div class="printable-form" style="display:block">',
                        container.outerHTML,
                        '</div>',
                        '</body>',
                        '</html>'
                    ];

                    var htmlContent = parts.join('\n');
                    var blob = new Blob([htmlContent], { type: 'text/html' });
                    var blobUrl = URL.createObjectURL(blob);

                    var iframe = document.createElement('iframe');
                    iframe.style.cssText = 'position:fixed;right:-10000px;bottom:0;width:0;height:0;border:0;';
                    document.body.appendChild(iframe);
                    iframe.src = blobUrl;

                    iframe.onload = function () {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                        setTimeout(function () {
                            document.body.removeChild(iframe);
                            URL.revokeObjectURL(blobUrl);
                            printable.style.display = 'none';
                        }, 1000);
                    };
                };

                // Show success overlay
                document.getElementById('successOverlay').classList.add('active');
                enrollmentForm.reset();
                console.log('Enrollment saved:', formData);

            } catch (e) {
                console.error('Inner error:', e);
                alert('There was an error processing the form. Please try again.\n' + e.message);
            }

        } else {
            var firstError = document.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

    } catch (e) {
        console.error('Submit error:', e);
        alert('There was an error. Please try again.\n' + e.message);
    }
});

// Clear errors on input / change
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(function (el) {
    el.addEventListener('input',  function () { el.closest('.form-group').classList.remove('error'); });
    el.addEventListener('change', function () { el.closest('.form-group').classList.remove('error'); });
});

// Aadhar auto-format — spaces every 4 digits
document.getElementById('AadharNo').addEventListener('input', function () {
    var val = this.value.replace(/\D/g, '').slice(0, 12);
    this.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
});
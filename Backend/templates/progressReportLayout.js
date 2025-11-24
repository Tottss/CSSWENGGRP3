export const generateProgressReportPDF = (doc, data) => {
    // helper functions
    const addSectionHeader = (text) => {
        doc.fontSize(14)
            .fillColor('#2c3e50')
            .text(text, { underline: true })
            .moveDown(0.5);
    };

    const addLabeledData = (label, value) => {
        doc.fontSize(10)
            .fillColor('#34495e')
            .text(label, { continued: true, bold: true })
            .fillColor('#000000')
            .text(`: ${value}`)
            .moveDown(0.3);
    };

    // header
    doc.fontSize(20)
        .fillColor('#1a73e8')
        .text('PROJECT PROGRESS REPORT', { align: 'center' })
        .moveDown(0.5);

    doc.fontSize(16)
        .fillColor('#000000')
        .text(data.project_name, { align: 'center' })
        .moveDown(0.3);

    doc.fontSize(11)
        .fillColor('#666666')
        .text(data.organization_name, { align: 'center' })
        .moveDown(0.2);

    doc.fontSize(10)
        .text(data.report_date, { align: 'center' })
        .moveDown(1.5);

    // project info
    addSectionHeader('Project Information');
    addLabeledData('Project Summary', data.project_summary);
    addLabeledData('Advocacy Area', data.advocacy_area);
    addLabeledData('SDG Alignment', data.sdg_alignment);
    addLabeledData('Timeline', data.timeline);
    addLabeledData('Location', data.location);
    addLabeledData('Last Update', data.last_update);
    doc.moveDown(1);

    // progress metrics
    addSectionHeader('Progress Metrics');

    doc.fontSize(10)
        .fillColor('#34495e')
        .text(`Overall Progress: ${data.progress_percent}%`, { bold: true })
        .moveDown(0.3);

    // progress bar
    const barWidth = 400;
    const barHeight = 20;
    const progressWidth = (barWidth * data.progress_percent) / 100;

    doc.rect(doc.x, doc.y, barWidth, barHeight)
        .fillAndStroke('#e0e0e0', '#999999');

    doc.rect(doc.x, doc.y, progressWidth, barHeight)
        .fill('#4caf50');

    doc.moveDown(2);

    addLabeledData('Target Beneficiaries', data.target_beneficiaries);
    addLabeledData('Actual Beneficiaries', data.actual_beneficiaries);
    addLabeledData('Achievement Rate', `${data.beneficiary_rate}%`);
    doc.moveDown(1);

    // budget section
    addSectionHeader('Budget Overview');
    addLabeledData('Total Budget', `₱${data.budget}`);
    addLabeledData('Expenses to Date', `₱${data.expenses_to_date}`);
    addLabeledData('Remaining Budget', `₱${data.remaining_budget}`);
    addLabeledData('Budget Utilization', `${data.budget_utilization}%`);
    doc.moveDown(1);

    // narrative section
    addSectionHeader('Progress Narrative');
    doc.fontSize(10)
        .fillColor('#000000')
        .text(data.narrative, {
            align: 'justify',
            lineGap: 2
        })
        .moveDown(1);
};
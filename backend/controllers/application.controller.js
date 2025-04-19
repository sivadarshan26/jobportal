import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { sendStatusEmail } from "../utils/mailer.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }
        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();
        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            succees:true
        });
    } catch (error) {
        console.log(error);
    }
}
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;

        console.log('📩 Received status update request');
        console.log('🔧 Application ID:', applicationId);
        console.log('📥 Requested new status:', status);

        if (!status) {
            console.warn('⚠️ Status not provided in request');
            return res.status(400).json({
                message: 'Status is required',
                success: false
            });
        }

        const allowedStatuses = ['accepted', 'rejected', 'pending'];
        if (!allowedStatuses.includes(status.toLowerCase())) {
            console.warn('❌ Invalid status value:', status);
            return res.status(400).json({
                message: 'Invalid status value',
                success: false
            });
        }

        console.log('✅ Status is valid, proceeding to find application...');

        const application = await Application.findOne({ _id: applicationId }).populate('applicant');
        if (!application) {
            console.error('❌ Application not found with ID:', applicationId);
            return res.status(404).json({
                message: "Application not found.",
                success: false
            });
        }

        console.log('📝 Application found. Current status:', application.status);
        console.log('👤 Applicant:', application.applicant?.name, `<${application.applicant?.email}>`);

        application.status = status.toLowerCase();
        await application.save();

        console.log('✅ Status updated in database to:', application.status);

        // 🔔 Send email notification
        const userEmail = application.applicant.email;
        const subject = `Your job application status has been updated`;
        const message = `Hello ${application.applicant.fullname},\n\nYour application status has been updated to: ${status.toUpperCase()}.`;

        console.log('📨 Sending status update email...');
        await sendStatusEmail(userEmail, subject, message);

        console.log('✅ Email sent to user:', userEmail);

        return res.status(200).json({
            message: "Status updated and email sent.",
            success: true
        });

    } catch (error) {
        console.error('💥 Error in updateStatus controller:', error.message);
        console.error('📛 Full error:', error);
        res.status(500).json({
            message: "Something went wrong",
            success: false
        });
    }
};

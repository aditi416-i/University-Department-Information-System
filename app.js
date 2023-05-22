require("dotenv").config();// Enviroment variables to store our secret key of encryption
const express = require("express")
const ejs = require("ejs")
const bodyParser = require("body-parser")
const mongoose = require("mongoose");
const _ = require("lodash");
const md5 = require("md5")

const app = express();

app.use(express.static(__dirname + "/public"));

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
userlogged = [];
mongoose.connect("mongodb://127.0.0.1:27017/UserDB", { useNewUrlParser: true });


const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});
const Admin = mongoose.model("Admin", adminSchema);

const departmentSchema = new mongoose.Schema({
    departmentname: String
});
const Department = mongoose.model("Department", departmentSchema);

const semesterSchema = new mongoose.Schema({
    semestername: String
});
const Semester = mongoose.model("Semester", semesterSchema);

const courseSchema = new mongoose.Schema({
    coursename: String,
    courseid: String,
    coursedepartment: String
});
const Course = mongoose.model("Course", courseSchema);

const studentSchema = new mongoose.Schema({
    name: String,
    rollno: String,
    email: String,
    phoneno: Number,
    address: String,
    dob: Date,
    course: String,
    department: String,
    password: String,
    gender: String
});

const Student = mongoose.model("Student", studentSchema);

const enrollSchema = new mongoose.Schema({
    course: courseSchema,
    semester: semesterSchema,
    student: studentSchema,
    mark: String
});
const EnrollCourse = mongoose.model("EnrollCourse", enrollSchema);

app.get("/", function (req, res) {
    res.render("home");
})
app.get("/login_student", function (req, res) {
    res.render("login_student");
})
app.get("/login_admin", function (req, res) {
    res.render("login_admin");
})

app.get("/course", function (req, res) {

    const getcourse = async () => {
        const result1 = await Course.find();
        const getdepartment = async () => {
            const result2 = await Department.find();
            res.render("course", { listdept: result2, listcourse: result1 });
        }
        getdepartment();
    }
    getcourse();

})
app.get("/department", function (req, res) {
    const getdepartment = async () => {
        const result = await Department.find();
        res.render("department", { listitem: result });
    }
    getdepartment();
})
app.get("/registration", function (req, res) {
    const getdepartment = async () => {
        const result = await Department.find();
        res.render("registration", { listdept: result });
    }
    getdepartment();
})
app.get("/semester", function (req, res) {
    const getsem = async () => {
        const result = await Semester.find();
        res.render("semester", { listitem: result });
    }
    getsem();
})
app.get("/project", function (req, res) {
    res.render("project");
})
app.get("/account", function (req, res) {
    res.render("account");
})

app.get("/enrollcourse", function (req, res) {
    const enroll = async () => {
        const result1 = await Student.findOne({ rollno: userlogged[0] });
        const dept = result1.department;
        const result2 = await Semester.find();
        const result3 = await Course.find({ coursedepartment: { $in: ["All", dept] } });
        res.render("enrollcourse", { listcourse: result3, listsemester: result2 });
    }
    enroll();
})
app.get("/sgradecard", function (req, res) {
    const getcourse = async (roll) => {
        const result1 = await Student.findOne({ rollno: roll });
        const result2 = await EnrollCourse.find({ student: result1 });
        const semname = await EnrollCourse.distinct("semester.semestername");

        var map1 = new Map(); //for courses
        var map2 = new Map(); // for sg
        var map3 = new Map(); // for cg


        for (var i = 0; i < semname.length; i++) {
            map1[semname[i]] = [];
            map2[semname[i]] = 0;
            map3[semname[i]] = 0;
        }
        for (var i = 0; i < result2.length; i++) {
            const name = result2[i].semester.semestername;
            var obj = { course: result2[i].course, mark: result2[i].mark, sem: name };
            map1[name].push(obj);
            map2[name] += Number(result2[i].mark);
        }
        var cg = 0;
        for (var i = 0; i < semname.length; i++) {
            map2[semname[i]] /= (map1[semname[i]].length * 10);
            cg += map2[semname[i]];
            map3[semname[i]] = cg / (i + 1);
            map2[semname[i]] = Number(map2[semname[i]]).toFixed(2);
            map3[semname[i]] = Number(map3[semname[i]]).toFixed(2);
        }

        res.render("print", { student: result1, sem: semname, map1: map1, map2: map2, map3: map3 });

    }
    getcourse(_.toUpper(userlogged[0]));
})
app.get("/myprofile", function (req, res) {
    const profile = async () => {
        const result = await Student.findOne({ rollno: userlogged[0] });
        res.render("myprofile", { student: result })
    }
    profile();
})

app.get("/studentdetail", function (req, res) {
    res.render("studentdetail");
})
app.post("/studentdetail", function (req, res) {
    if (req.body.detail == "marks") {
        const fun = async (roll) => {
            const result1 = await Student.findOne({ rollno: roll });
            const result2 = await EnrollCourse.find({ student: result1 }).exists("mark", false);
            res.render("mark", { student: result1, listcourse: result2 });
        }
        fun(_.toUpper(req.body.rollno));
    }
    else if (req.body.detail == "Complete") {
        const fun = async (roll) => {
            const result1 = await Student.findOne({ rollno: roll });
            const result2 = await EnrollCourse.find({ student: result1, mark: { $gte: 35 } });
            res.render("complete", { status: "Completed", student: result1, listcourse: result2 });
        }
        fun(_.toUpper(req.body.rollno));
    }
    else if (req.body.detail == "Backlog") {
        const fun = async (roll) => {
            const result1 = await Student.findOne({ rollno: roll });
            const result2 = await EnrollCourse.find({ student: result1, mark: { $lt: 35 } });
            res.render("complete", { status: "Backlog", student: result1, listcourse: result2 });
        }
        fun(_.toUpper(req.body.rollno));
    }
    else if (req.body.detail == "gradecard") {
        const getcourse = async (roll) => {
            const result1 = await Student.findOne({ rollno: roll });
            const result2 = await EnrollCourse.find({ student: result1 });
            const semname = await EnrollCourse.distinct("semester.semestername");

            var map1 = new Map(); //for courses
            var map2 = new Map(); // for sg
            var map3 = new Map(); // for cg


            for (var i = 0; i < semname.length; i++) {
                map1[semname[i]] = [];
                map2[semname[i]] = 0;
                map3[semname[i]] = 0;
            }
            for (var i = 0; i < result2.length; i++) {
                const name = result2[i].semester.semestername;
                var obj = { course: result2[i].course, mark: result2[i].mark, sem: name };
                map1[name].push(obj);
                map2[name] += Number(result2[i].mark);
            }
            var cg = 0;
            for (var i = 0; i < semname.length; i++) {
                map2[semname[i]] /= (map1[semname[i]].length * 10);
                cg += map2[semname[i]];
                map3[semname[i]] = cg / (i + 1);
                map2[semname[i]] = Number(map2[semname[i]]).toFixed(2);
                map3[semname[i]] = Number(map3[semname[i]]).toFixed(2);
            }

            res.render("print", { student: result1, sem: semname, map1: map1, map2: map2, map3: map3 });

        }

        getcourse(_.toUpper(req.body.rollno))
    }
    else if (req.body.detail == "profile") {
        const profile = async (roll) => {
            const result = await Student.findOne({ rollno: roll });
            res.render("stdprofile", { student: result })
        }
        profile(_.toUpper(req.body.rollno));
    }
})

app.post("/addmark", function (req, res) {
    const l = req.body.courselist.length;
    for (var i = 0; i < l; i++) {
        const fun = async (id, marks) => {
            const result = await EnrollCourse.updateOne({ _id: id }, { mark: marks });
        }
        fun(req.body.courselist[i], req.body.markofcourse[i])
    }
    res.redirect("/studentdetail")
})
app.post("/enrollcourse", function (req, res) {
    const id1 = req.body.semester;
    const id2 = req.body.course;

    const enroll = async (id1, id2) => {
        const result1 = await Semester.findById(id1);
        const result2 = await Course.findById(id2);
        const result3 = await Student.findOne({ rollno: userlogged[0] });
        const result = await EnrollCourse.findOne({ semester: result1, course: result2, student: result3 });
        if (result == null) {
            const newenroll = new EnrollCourse({
                semester: result1,
                course: result2,
                student: result3,
            })
            newenroll.save();
        }
        res.render("student_page");
    }
    enroll(id1, id2);
})
app.post("/semester", function (req, res) {
    const name = _.toUpper(req.body.semestername);
    const sem = new Semester({
        semestername: name
    })
    sem.save();
    res.redirect("/semester");

})
app.post("/removesemester", function (req, res) {
    const removesem = async (id) => {
        const result = await Semester.findByIdAndDelete(id);
        res.redirect("/semester");
    }
    removesem(req.body.removesemester);
})
app.post("/registration", function (req, res) {
    const name = _.capitalize(req.body.fullname);
    const rollno = _.toUpper(req.body.Rollno);
    const email = req.body.Email;
    const phone = req.body.Phone;
    const address = req.body.Address;
    const dob = req.body.year;
    const course = req.body.Course;
    const department = req.body.department;
    const pass = md5(req.body.password);
    const gender = req.body.gender;
    const student = new Student({
        name: name,
        rollno: rollno,
        email: email,
        phoneno: phone,
        address: address,
        dob: dob,
        course: course,
        department: department,
        password: pass,
        gender: gender
    })
    student.save();
    res.render("admin_page");
})
app.post("/department", function (req, res) {
    const name = _.startCase(req.body.departmentname);
    const dept = new Department({
        departmentname: name
    })
    dept.save();
    res.redirect("/department");

})
app.post("/removedepartment", function (req, res) {
    const removedept = async (id) => {
        const result = await Department.findByIdAndDelete(id);
        res.redirect("/department");
    }
    removedept(req.body.removedepartment);
})
app.post("/course", function (req, res) {

    const name = _.startCase(req.body.coursename);
    const id = _.upperCase(req.body.courseid);
    const dept = req.body.department;
    const course = new Course({
        coursename: name,
        courseid: id,
        coursedepartment: dept
    })
    course.save();
    res.redirect("/course");

})
app.post("/removecourse", function (req, res) {
    const removecourse = async (id) => {
        const result = await Course.findByIdAndDelete(id);
        res.redirect("/course");
    }
    removecourse(req.body.removecourse);
})
app.post("/login_admin", function (req, res) {
    const name = req.body.username;
    const pass = md5(req.body.password);
    const getdata = async () => {
        const result = await Admin.findOne({ username: name });
        if (result == null) {
            res.redirect("login_admin");
        }
        else {
            if (result.password == pass) {
                res.render("admin_page");
            }
            else {
                res.redirect("login_admin");
            }
        }
    }
    getdata();

})
app.post("/login_student", function (req, res) {
    const roll = _.toUpper(req.body.rollno);
    const pass = md5(req.body.password);
    userlogged[0] = roll;
    const getdata = async () => {
        const result = await Student.findOne({ rollno: roll });
        if (result == null) {
            res.redirect("login_student");
        }
        else {
            if (result.password == pass) {
                res.render("student_page");
            }
            else {
                res.redirect("login_student");
            }
        }
    }
    getdata();

})
app.listen(3000, function (req, res) {
    console.log("Server is waiting on port 3000");
})
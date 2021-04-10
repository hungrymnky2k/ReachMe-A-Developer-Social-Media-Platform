const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const request = require("request");
const config = require("config");

//@route    GET api/profile/me
//@desc     PRIVATE Get current users profile
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(401).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

//@route    POST api/profile
//@desc     PRIVATE Create or Update profile
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    const profileFields = {};

    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      //UPDATE IF FOUND
      if (profile) {
        //UPDATE

        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      //CREATE NEW PROFILE

      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }

    res.send("dummy");
  }
);

//@route    GET api/profile
//@desc     PUBLIC Get all profiles

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

//@route    GET api/profile/user/:user_id
//@desc     PUBLIC profile by user_id

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(401).json({ msg: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    console.log(error);
    if (error.kind == "ObjectId") {
      return res.status(401).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//@route    DELETE api/profile
//@desc     PRIVATE delete profile and user

router.delete("/", auth, async (req, res) => {
  try {
    //REMOVE PROFILE
    await Profile.findOneAndRemove({ user: req.user.id });

    //REMOVE USER
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User Removed!" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

//@route    PUT api/profile/experience
//@desc     PRIVATE Add profile Experience

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is Required").not().isEmpty(),
      check("company", "Company is Required").not().isEmpty(),
      check("from", "From date is Required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  }
);

//@route    DELETE api/profile/experience/:exp_id
//@desc     PRIVATE Delete experience from profile

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get the params exp_id and match it to the experience id
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

//@route    PUT api/profile/education
//@desc     PRIVATE Add profile Education

router.put(
  "/education",
  [
    auth,
    [
      check("school", "school is Required").not().isEmpty(),
      check("degree", "degree is Required").not().isEmpty(),
      check("fieldofstudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is Required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  }
);

//@route    DELETE api/profile/education/:edu_id
//@desc     PRIVATE Delete Education from profile

router.delete("/education/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get the params edu_id and match it to the education id
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

//@route    GET api/profile/education/:username
//@desc     PUBLIC Get github user

router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubCliendId"
      )}&client_secret=${config.get("githubSecret")}}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) console.log(error);

      if (response.statusCode != 200) {
        res.status(404).json({ msg: "No Github Profile Found" });
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});
module.exports = router;

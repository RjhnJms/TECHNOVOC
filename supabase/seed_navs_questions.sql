-- NAVS TECHNO-VOC question bank seed
-- 11 courses x 20 questions (10 pre-skilled + 10 aptitude) = 220 in bank
-- Each student exam: 10 random per course x 11 courses = 110 items
--
-- Run in Supabase SQL Editor after courses exist.

DELETE FROM questions WHERE course_id IN (
  SELECT id FROM courses WHERE course_name IN ($c$Automotive$c$, $c$Agriculture$c$, $c$Beauty Care$c$, $c$Carpentry$c$, $c$Dressmaking$c$, $c$Drafting$c$, $c$Electricity$c$, $c$Electronics$c$, $c$Food Tech$c$, $c$ICT$c$, $c$SMAW$c$)
);

-- Automotive (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v1q$What does PPE stand for in an automotive workshop?$v1q$,
  c.id,
  $v1ty$pre-skilled$v1ty$,
  $v1a$Personal Protective Equipment$v1a$,
  $v1b$Power Performance Engine$v1b$,
  $v1c$Primary Process Evaluation$v1c$,
  $v1d$Portable Pump Equipment$v1d$,
  $v1ok$Option A$v1ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v2q$Which tool is used to measure spark plug gap?$v2q$,
  c.id,
  $v2ty$pre-skilled$v2ty$,
  $v2a$Torque wrench$v2a$,
  $v2b$Feeler gauge$v2b$,
  $v2c$Dial indicator$v2c$,
  $v2d$Micrometer$v2d$,
  $v2ok$Option B$v2ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v3q$Engine oil is primarily used to:$v3q$,
  c.id,
  $v3ty$pre-skilled$v3ty$,
  $v3a$Cool the battery$v3a$,
  $v3b$Lubricate moving parts$v3b$,
  $v3c$Increase fuel octane$v3c$,
  $v3d$Clean the exhaust$v3d$,
  $v3ok$Option B$v3ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v4q$A dead battery is often first checked with a:$v4q$,
  c.id,
  $v4ty$pre-skilled$v4ty$,
  $v4a$Compression tester$v4a$,
  $v4b$Multimeter$v4b$,
  $v4c$Timing light$v4c$,
  $v4d$Vacuum gauge$v4d$,
  $v4ok$Option B$v4ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v5q$Brake fluid should be handled carefully because it:$v5q$,
  c.id,
  $v5ty$pre-skilled$v5ty$,
  $v5a$Freezes easily$v5a$,
  $v5b$Can damage painted surfaces$v5b$,
  $v5c$Conducts electricity$v5c$,
  $v5d$Evaporates instantly$v5d$,
  $v5ok$Option B$v5ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v6q$The firing order is found in the:$v6q$,
  c.id,
  $v6ty$pre-skilled$v6ty$,
  $v6a$Tire sidewall$v6a$,
  $v6b$Service manual or label$v6b$,
  $v6c$Oil filter cap$v6c$,
  $v6d$Radiator hose$v6d$,
  $v6ok$Option B$v6ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v7q$Wheel lug nuts are tightened in a pattern to:$v7q$,
  c.id,
  $v7ty$pre-skilled$v7ty$,
  $v7a$Save time$v7a$,
  $v7b$Distribute clamping evenly$v7b$,
  $v7c$Reduce tire wear only$v7c$,
  $v7d$Align the camshaft$v7d$,
  $v7ok$Option B$v7ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v8q$A timing belt connects the crankshaft to the:$v8q$,
  c.id,
  $v8ty$pre-skilled$v8ty$,
  $v8a$Alternator only$v8a$,
  $v8b$Camshaft$v8b$,
  $v8c$Steering rack$v8c$,
  $v8d$Fuel pump only$v8d$,
  $v8ok$Option B$v8ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v9q$Coolant overflow tank level is checked when the engine is:$v9q$,
  c.id,
  $v9ty$pre-skilled$v9ty$,
  $v9a$At operating temperature or cool per manual$v9a$,
  $v9b$Revving at 3000 RPM$v9b$,
  $v9c$Removed from the bay$v9c$,
  $v9d$Running with AC off only$v9d$,
  $v9ok$Option A$v9ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v10q$An OBD-II scanner is used to:$v10q$,
  c.id,
  $v10ty$pre-skilled$v10ty$,
  $v10a$Balance tires$v10a$,
  $v10b$Read diagnostic trouble codes$v10b$,
  $v10c$Measure bore diameter$v10c$,
  $v10d$Adjust headlight aim only$v10d$,
  $v10ok$Option B$v10ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v11q$If 4 tires cost 3200 pesos each, what is the total?$v11q$,
  c.id,
  $v11ty$aptitude$v11ty$,
  $v11a$9600 pesos$v11a$,
  $v11b$12800 pesos$v11b$,
  $v11c$11200 pesos$v11c$,
  $v11d$10800 pesos$v11d$,
  $v11ok$Option B$v11ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v12q$A workshop rule says 'lift heavy parts with your legs.' This mainly prevents:$v12q$,
  c.id,
  $v12ty$aptitude$v12ty$,
  $v12a$Eye strain$v12a$,
  $v12b$Back injury$v12b$,
  $v12c$Hearing loss$v12c$,
  $v12d$Sunburn$v12d$,
  $v12ok$Option B$v12ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v13q$Oil label 10W-40: the number 40 refers to viscosity at:$v13q$,
  c.id,
  $v13ty$aptitude$v13ty$,
  $v13a$Cold start only$v13a$,
  $v13b$High operating temperature$v13b$,
  $v13c$Idle RPM only$v13c$,
  $v13d$Battery voltage$v13d$,
  $v13ok$Option B$v13ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v14q$A car travels 60 km in 1 hour. Its average speed is:$v14q$,
  c.id,
  $v14ty$aptitude$v14ty$,
  $v14a$30 km/h$v14a$,
  $v14b$60 km/h$v14b$,
  $v14c$90 km/h$v14c$,
  $v14d$120 km/h$v14d$,
  $v14ok$Option B$v14ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v15q$Which sequence is safest when jacking a vehicle?$v15q$,
  c.id,
  $v15ty$aptitude$v15ty$,
  $v15a$Jack first, then chock wheels$v15a$,
  $v15b$Park on level ground, engage brake, chock wheels, then jack$v15b$,
  $v15c$Remove wheels before jacking$v15c$,
  $v15d$Jack on a slope for access$v15d$,
  $v15ok$Option B$v15ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v16q$If resistance increases in a circuit, current will generally:$v16q$,
  c.id,
  $v16ty$aptitude$v16ty$,
  $v16a$Always double$v16a$,
  $v16b$Decrease if voltage is constant$v16b$,
  $v16c$Stay unchanged$v16c$,
  $v16d$Become zero always$v16d$,
  $v16ok$Option B$v16ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v17q$A technician reads 'RTV' on a gasket procedure. They should:$v17q$,
  c.id,
  $v17ty$aptitude$v17ty$,
  $v17a$Skip the step$v17a$,
  $v17b$Follow the manual for sealant use$v17b$,
  $v17c$Use only tape$v17c$,
  $v17d$Overtighten bolts$v17d$,
  $v17ok$Option B$v17ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v18q$Half of 48 bolt sets is:$v18q$,
  c.id,
  $v18ty$aptitude$v18ty$,
  $v18a$20$v18a$,
  $v18b$24$v18b$,
  $v18c$28$v18c$,
  $v18d$36$v18d$,
  $v18ok$Option B$v18ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v19q$Gasoline vapor is dangerous mainly because it is:$v19q$,
  c.id,
  $v19ty$aptitude$v19ty$,
  $v19a$Heavy and sinks$v19a$,
  $v19b$Flammable$v19b$,
  $v19c$Radioactive$v19c$,
  $v19d$Always visible$v19d$,
  $v19ok$Option B$v19ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v20q$Choosing the correct wrench size first helps avoid:$v20q$,
  c.id,
  $v20ty$aptitude$v20ty$,
  $v20a$Better fuel economy$v20a$,
  $v20b$Rounded fasteners and injury$v20b$,
  $v20c$Paint fading$v20c$,
  $v20d$Radio interference$v20d$,
  $v20ok$Option B$v20ok$
FROM courses c WHERE c.course_name = $course$Automotive$course$ LIMIT 1;

-- Agriculture (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v21q$Composting improves soil by adding:$v21q$,
  c.id,
  $v21ty$pre-skilled$v21ty$,
  $v21a$Plastic mulch$v21a$,
  $v21b$Organic matter$v21b$,
  $v21c$Salt$v21c$,
  $v21d$Cement$v21d$,
  $v21ok$Option B$v21ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v22q$A hand trowel is mainly used for:$v22q$,
  c.id,
  $v22ty$pre-skilled$v22ty$,
  $v22a$Harvesting rice$v22a$,
  $v22b$Transplanting seedlings$v22b$,
  $v22c$Ploughing fields$v22c$,
  $v22d$Irrigation pumping$v22d$,
  $v22ok$Option B$v22ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v23q$Integrated Pest Management (IPM) emphasizes:$v23q$,
  c.id,
  $v23ty$pre-skilled$v23ty$,
  $v23a$Only chemical sprays$v23a$,
  $v23b$Multiple control methods$v23b$,
  $v23c$Ignoring pests$v23c$,
  $v23d$Burning all crops$v23d$,
  $v23ok$Option B$v23ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v24q$NPK fertilizer provides:$v24q$,
  c.id,
  $v24ty$pre-skilled$v24ty$,
  $v24a$Nitrogen, phosphorus, potassium$v24a$,
  $v24b$Nickel, platinum, krypton$v24b$,
  $v24c$Neon, phosphorus, kelp$v24c$,
  $v24d$Nitrogen only$v24d$,
  $v24ok$Option A$v24ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v25q$Crop rotation helps reduce:$v25q$,
  c.id,
  $v25ty$pre-skilled$v25ty$,
  $v25a$Soil building$v25a$,
  $v25b$Pest and disease buildup$v25b$,
  $v25c$Sunlight$v25c$,
  $v25d$Rainfall$v25d$,
  $v25ok$Option B$v25ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v26q$Drip irrigation saves water by:$v26q$,
  c.id,
  $v26ty$pre-skilled$v26ty$,
  $v26a$Flooding the field$v26a$,
  $v26b$Delivering water near roots$v26b$,
  $v26c$Spraying leaves only at noon$v26c$,
  $v26d$Using salt water$v26d$,
  $v26ok$Option B$v26ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v27q$A greenhouse primarily:$v27q$,
  c.id,
  $v27ty$pre-skilled$v27ty$,
  $v27a$Blocks all light$v27a$,
  $v27b$Controls temperature and humidity$v27b$,
  $v27c$Replaces soil$v27c$,
  $v27d$Stores gasoline$v27d$,
  $v27ok$Option B$v27ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v28q$Hybrid seeds are produced by:$v28q$,
  c.id,
  $v28ty$pre-skilled$v28ty$,
  $v28a$Crossing selected parent lines$v28a$,
  $v28b$Freezing seeds$v28b$,
  $v28c$Adding dye$v28c$,
  $v28d$Drying in sunlight only$v28d$,
  $v28ok$Option A$v28ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v29q$Soil pH affects:$v29q$,
  c.id,
  $v29ty$pre-skilled$v29ty$,
  $v29a$Only seed color$v29a$,
  $v29b$Nutrient availability to plants$v29b$,
  $v29c$Wind speed$v29c$,
  $v29d$Tractor horsepower$v29d$,
  $v29ok$Option B$v29ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v30q$Harvesting leafy vegetables in the cool morning helps:$v30q$,
  c.id,
  $v30ty$pre-skilled$v30ty$,
  $v30a$Increase wilting$v30a$,
  $v30b$Maintain freshness$v30b$,
  $v30c$Kill all pests instantly$v30c$,
  $v30d$Remove soil permanently$v30d$,
  $v30ok$Option B$v30ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v31q$A plot is 10 m by 5 m. Its area is:$v31q$,
  c.id,
  $v31ty$aptitude$v31ty$,
  $v31a$15 m²$v31a$,
  $v31b$50 m²$v31b$,
  $v31c$25 m²$v31c$,
  $v31d$100 m²$v31d$,
  $v31ok$Option B$v31ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v32q$If 8 workers finish a task in 6 hours, more workers (same skill) will usually:$v32q$,
  c.id,
  $v32ty$aptitude$v32ty$,
  $v32a$Take longer$v32a$,
  $v32b$Finish sooner$v32b$,
  $v32c$Change soil pH$v32c$,
  $v32d$Stop rain$v32d$,
  $v32ok$Option B$v32ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v33q$Reading a weather forecast before spraying pesticides helps avoid:$v33q$,
  c.id,
  $v33ty$aptitude$v33ty$,
  $v33a$Better yields always$v33a$,
  $v33b$Drift and wash-off from rain$v33b$,
  $v33c$Seed germination only$v33c$,
  $v33d$Soil compaction$v33d$,
  $v33ok$Option B$v33ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v34q$25% of 200 kg harvest is:$v34q$,
  c.id,
  $v34ty$aptitude$v34ty$,
  $v34a$40 kg$v34a$,
  $v34b$50 kg$v34b$,
  $v34c$75 kg$v34c$,
  $v34d$100 kg$v34d$,
  $v34ok$Option B$v34ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v35q$Overwatering seedlings often causes:$v35q$,
  c.id,
  $v35ty$aptitude$v35ty$,
  $v35a$Faster photosynthesis only$v35a$,
  $v35b$Root rot and poor growth$v35b$,
  $v35c$Instant flowering$v35c$,
  $v35d$Higher oil content$v35d$,
  $v35ok$Option B$v35ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v36q$A farmer tests soil before planting to:$v36q$,
  c.id,
  $v36ty$aptitude$v36ty$,
  $v36a$Choose paint color$v36a$,
  $v36b$Decide amendments and crops$v36b$,
  $v36c$Measure wind$v36c$,
  $v36d$Fix engines$v36d$,
  $v36ok$Option B$v36ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v37q$Storing chemicals in labeled containers prevents:$v37q$,
  c.id,
  $v37ty$aptitude$v37ty$,
  $v37a$Photosynthesis$v37a$,
  $v37b$Misuse and poisoning$v37b$,
  $v37c$Rain$v37c$,
  $v37d$Pollination$v37d$,
  $v37ok$Option B$v37ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v38q$3 rows with 40 plants each have how many plants?$v38q$,
  c.id,
  $v38ty$aptitude$v38ty$,
  $v38a$43$v38a$,
  $v38b$80$v38b$,
  $v38c$120$v38c$,
  $v38d$160$v38d$,
  $v38ok$Option C$v38ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v39q$Beneficial insects in a farm ecosystem can:$v39q$,
  c.id,
  $v39ty$aptitude$v39ty$,
  $v39a$Destroy all crops$v39a$,
  $v39b$Help control pests naturally$v39b$,
  $v39c$Replace water$v39c$,
  $v39d$Increase gasoline use$v39d$,
  $v39ok$Option B$v39ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v40q$Mulching conserves moisture by:$v40q$,
  c.id,
  $v40ty$aptitude$v40ty$,
  $v40a$Heating soil surface$v40a$,
  $v40b$Reducing evaporation$v40b$,
  $v40c$Blocking all air$v40c$,
  $v40d$Adding salt$v40d$,
  $v40ok$Option B$v40ok$
FROM courses c WHERE c.course_name = $course$Agriculture$course$ LIMIT 1;

-- Beauty Care (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v41q$Sanitation in a salon prevents:$v41q$,
  c.id,
  $v41ty$pre-skilled$v41ty$,
  $v41a$Hair growth$v41a$,
  $v41b$Cross-infection$v41b$,
  $v41c$Client relaxation only$v41c$,
  $v41d$Product evaporation$v41d$,
  $v41ok$Option B$v41ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v42q$A patch test checks for:$v42q$,
  c.id,
  $v42ty$pre-skilled$v42ty$,
  $v42a$Hair length$v42a$,
  $v42b$Allergic reaction to products$v42b$,
  $v42c$Nail hardness only$v42c$,
  $v42d$Scalp temperature$v42d$,
  $v42ok$Option B$v42ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v43q$Shampoo is applied to:$v43q$,
  c.id,
  $v43ty$pre-skilled$v43ty$,
  $v43a$Dry painted walls$v43a$,
  $v43b$Scalp and hair$v43b$,
  $v43c$Metal tools only$v43c$,
  $v43d$Client shoes$v43d$,
  $v43ok$Option B$v43ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v44q$Sterilizing metal implements commonly uses:$v44q$,
  c.id,
  $v44ty$pre-skilled$v44ty$,
  $v44a$Plain water only$v44a$,
  $v44b$Approved disinfectant or autoclave$v44b$,
  $v44c$Perfume$v44c$,
  $v44d$Hair spray$v44d$,
  $v44ok$Option B$v44ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v45q$Hair porosity refers to:$v45q$,
  c.id,
  $v45ty$pre-skilled$v45ty$,
  $v45a$Hair color brand$v45a$,
  $v45b$Ability to absorb moisture$v45b$,
  $v45c$Scissors sharpness$v45c$,
  $v45d$Chair height$v45d$,
  $v45ok$Option B$v45ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v46q$A concave hairbrush helps create:$v46q$,
  c.id,
  $v46ty$pre-skilled$v46ty$,
  $v46a$Flat iron rust$v46a$,
  $v46b$Curl and volume when blow-drying$v46b$,
  $v46c$Nail polish$v46c$,
  $v46d$Skin peels$v46d$,
  $v46ok$Option B$v46ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v47q$Facial cleansing removes:$v47q$,
  c.id,
  $v47ty$pre-skilled$v47ty$,
  $v47a$Bone structure$v47a$,
  $v47b$Surface dirt and excess oil$v47b$,
  $v47c$All melanin permanently$v47c$,
  $v47d$Client consent$v47d$,
  $v47ok$Option B$v47ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v48q$Manicure cuticle work should be:$v48q$,
  c.id,
  $v48ty$pre-skilled$v48ty$,
  $v48a$Aggressive tearing$v48a$,
  $v48b$Gentle and hygienic$v48b$,
  $v48c$Done with dirty tools$v48c$,
  $v48d$Skipped always$v48d$,
  $v48ok$Option B$v48ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v49q$Hair color levels range from dark to light; level 1 is:$v49q$,
  c.id,
  $v49ty$pre-skilled$v49ty$,
  $v49a$Lightest blonde$v49a$,
  $v49b$Darkest$v49b$,
  $v49c$Medium brown only$v49c$,
  $v49d$Clear$v49d$,
  $v49ok$Option B$v49ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v50q$Client consultation records help track:$v50q$,
  c.id,
  $v50ty$pre-skilled$v50ty$,
  $v50a$Weather only$v50a$,
  $v50b$Services, allergies, and formulas$v50b$,
  $v50c$Floor tiles$v50c$,
  $v50d$Parking fees$v50d$,
  $v50ok$Option B$v50ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v51q$Mixing 1 part developer with 2 parts color means ratio:$v51q$,
  c.id,
  $v51ty$aptitude$v51ty$,
  $v51a$1:2$v51a$,
  $v51b$2:1$v51b$,
  $v51c$1:1 only$v51c$,
  $v51d$3:0$v51d$,
  $v51ok$Option A$v51ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v52q$A client reports burning during a chemical service. You should:$v52q$,
  c.id,
  $v52ty$aptitude$v52ty$,
  $v52a$Continue quickly$v52a$,
  $v52b$Stop and rinse per safety protocol$v52b$,
  $v52c$Add more product$v52c$,
  $v52d$Use hotter water$v52d$,
  $v52ok$Option B$v52ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v53q$If a service takes 45 minutes and starts at 2:00 PM, it ends at:$v53q$,
  c.id,
  $v53ty$aptitude$v53ty$,
  $v53a$2:30 PM$v53a$,
  $v53b$2:45 PM$v53b$,
  $v53c$3:00 PM$v53c$,
  $v53d$3:15 PM$v53d$,
  $v53ok$Option B$v53ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v54q$Double-processing hair without assessment risks:$v54q$,
  c.id,
  $v54ty$aptitude$v54ty$,
  $v54a$Better shine only$v54a$,
  $v54b$Damage and breakage$v54b$,
  $v54c$Faster nail growth$v54c$,
  $v54d$Lower room temperature$v54d$,
  $v54ok$Option B$v54ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v55q$20% discount on a 500 peso service saves:$v55q$,
  c.id,
  $v55ty$aptitude$v55ty$,
  $v55a$50 pesos$v55a$,
  $v55b$100 pesos$v55b$,
  $v55c$150 pesos$v55c$,
  $v55d$200 pesos$v55d$,
  $v55ok$Option B$v55ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v56q$Wearing gloves during hair color application mainly protects:$v56q$,
  c.id,
  $v56ty$aptitude$v56ty$,
  $v56a$Client shoes$v56a$,
  $v56b$Your skin from chemicals$v56b$,
  $v56c$Mirrors$v56c$,
  $v56d$Music volume$v56d$,
  $v56ok$Option B$v56ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v57q$Organizing tools before a client arrives improves:$v57q$,
  c.id,
  $v57ty$aptitude$v57ty$,
  $v57a$Soil fertility$v57a$,
  $v57b$Efficiency and professionalism$v57b$,
  $v57c$Engine torque$v57c$,
  $v57d$Crop yield$v57d$,
  $v57ok$Option B$v57ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v58q$A strand test before full color helps predict:$v58q$,
  c.id,
  $v58ty$aptitude$v58ty$,
  $v58a$Client height$v58a$,
  $v58b$Result and damage risk$v58b$,
  $v58c$Wind direction$v58c$,
  $v58d$Tax rate$v58d$,
  $v58ok$Option B$v58ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v59q$Ventilation in a chemical service area reduces:$v59q$,
  c.id,
  $v59ty$aptitude$v59ty$,
  $v59a$Hair count$v59a$,
  $v59b$Fume buildup$v59b$,
  $v59c$Water pressure$v59c$,
  $v59d$Nail length$v59d$,
  $v59ok$Option B$v59ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v60q$Three clients at 30 minutes each need at least:$v60q$,
  c.id,
  $v60ty$aptitude$v60ty$,
  $v60a$30 minutes total$v60a$,
  $v60b$90 minutes total$v60b$,
  $v60c$60 minutes total$v60c$,
  $v60d$15 minutes total$v60d$,
  $v60ok$Option B$v60ok$
FROM courses c WHERE c.course_name = $course$Beauty Care$course$ LIMIT 1;

-- Carpentry (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v61q$A try square is used to mark:$v61q$,
  c.id,
  $v61ty$pre-skilled$v61ty$,
  $v61a$Curved arcs only$v61a$,
  $v61b$90-degree angles$v61b$,
  $v61c$Pipe threads$v61c$,
  $v61d$Electrical loads$v61d$,
  $v61ok$Option B$v61ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v62q$Pilot holes before screwing help prevent:$v62q$,
  c.id,
  $v62ty$pre-skilled$v62ty$,
  $v62a$Better paint$v62a$,
  $v62b$Wood splitting$v62b$,
  $v62c$Metal rust only$v62c$,
  $v62d$Glass cutting$v62d$,
  $v62ok$Option B$v62ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v63q$Plywood grain direction affects:$v63q$,
  c.id,
  $v63ty$pre-skilled$v63ty$,
  $v63a$Nothing$v63a$,
  $v63b$Strength and appearance$v63b$,
  $v63c$Battery life$v63c$,
  $v63d$Water boiling point$v63d$,
  $v63ok$Option B$v63ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v64q$A claw hammer is used for:$v64q$,
  c.id,
  $v64ty$pre-skilled$v64ty$,
  $v64a$Welding aluminum$v64a$,
  $v64b$Driving and removing nails$v64b$,
  $v64c$Mixing concrete by hand only$v64c$,
  $v64d$Soldering wires$v64d$,
  $v64ok$Option B$v64ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v65q$Wood moisture content should be appropriate to avoid:$v65q$,
  c.id,
  $v65ty$pre-skilled$v65ty$,
  $v65a$Better glue only$v65a$,
  $v65b$Warping and shrinkage$v65b$,
  $v65c$Louder music$v65c$,
  $v65d$Faster internet$v65d$,
  $v65ok$Option B$v65ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v66q$A chisel should be struck with:$v66q$,
  c.id,
  $v66ty$pre-skilled$v66ty$,
  $v66a$A wooden mallet or hammer on handle end properly$v66a$,
  $v66b$Any rock$v66b$,
  $v66c$A welding torch$v66c$,
  $v66d$Paint brush$v66d$,
  $v66ok$Option A$v66ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v67q$Level tool bubble centered means surface is:$v67q$,
  c.id,
  $v67ty$pre-skilled$v67ty$,
  $v67a$Magnetic$v67a$,
  $v67b$Horizontal or vertical as intended$v67b$,
  $v67c$Underwater$v67c$,
  $v67d$Radioactive$v67d$,
  $v67ok$Option B$v67ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v68q$Countersink bit allows screw head to:$v68q$,
  c.id,
  $v68ty$pre-skilled$v68ty$,
  $v68a$Stick out more$v68a$,
  $v68b$Sit flush or below surface$v68b$,
  $v68c$Melt plastic$v68c$,
  $v68d$Conduct AC power$v68d$,
  $v68ok$Option B$v68ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v69q$Safety goggles protect against:$v69q$,
  c.id,
  $v69ty$pre-skilled$v69ty$,
  $v69a$Only sunburn$v69a$,
  $v69b$Flying chips and dust$v69b$,
  $v69c$Loud sounds only$v69c$,
  $v69d$Weight gain$v69d$,
  $v69ok$Option B$v69ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v70q$Measuring twice before cutting helps:$v70q$,
  c.id,
  $v70ty$pre-skilled$v70ty$,
  $v70a$Waste material and errors$v70a$,
  $v70b$Increase humidity$v70b$,
  $v70c$Change voltage$v70c$,
  $v70d$Grow plants$v70d$,
  $v70ok$Option A$v70ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v71q$Board length 2.4 m cut into 4 equal pieces: each piece is:$v71q$,
  c.id,
  $v71ty$aptitude$v71ty$,
  $v71a$0.4 m$v71a$,
  $v71b$0.6 m$v71b$,
  $v71c$0.8 m$v71c$,
  $v71d$1.2 m$v71d$,
  $v71ok$Option B$v71ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v72q$If 3 workers need 12 hours, 6 equal workers need about:$v72q$,
  c.id,
  $v72ty$aptitude$v72ty$,
  $v72a$24 hours$v72a$,
  $v72b$6 hours$v72b$,
  $v72c$12 hours$v72c$,
  $v72d$3 hours$v72d$,
  $v72ok$Option B$v72ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v73q$Diagonal of a square frame checks if corners are:$v73q$,
  c.id,
  $v73ty$aptitude$v73ty$,
  $v73a$Round$v73a$,
  $v73b$Square$v73b$,
  $v73c$Wet$v73c$,
  $v73d$Magnetic$v73d$,
  $v73ok$Option B$v73ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v74q$Saw blade teeth pointing wrong direction will:$v74q$,
  c.id,
  $v74ty$aptitude$v74ty$,
  $v74a$Cut faster always$v74a$,
  $v74b$Cut poorly or dangerously$v74b$,
  $v74c$Polish metal$v74c$,
  $v74d$Pump water$v74d$,
  $v74ok$Option B$v74ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v75q$15% of 2000 pesos material cost is:$v75q$,
  c.id,
  $v75ty$aptitude$v75ty$,
  $v75a$200 pesos$v75a$,
  $v75b$300 pesos$v75b$,
  $v75c$350 pesos$v75c$,
  $v75d$400 pesos$v75d$,
  $v75ok$Option B$v75ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v76q$Extension cord on floor in workshop is a:$v76q$,
  c.id,
  $v76ty$aptitude$v76ty$,
  $v76a$Good storage$v76a$,
  $v76b$Trip hazard$v76b$,
  $v76c$Measuring tool$v76c$,
  $v76d$Clamp$v76d$,
  $v76ok$Option B$v76ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v77q$Choosing harder wood for legs and softer for panels is:$v77q$,
  c.id,
  $v77ty$aptitude$v77ty$,
  $v77a$Random$v77a$,
  $v77b$Matching properties to use$v77b$,
  $v77c$Illegal$v77c$,
  $v77d$Only for metal$v77d$,
  $v77ok$Option B$v77ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v78q$2.5 cm is equal to:$v78q$,
  c.id,
  $v78ty$aptitude$v78ty$,
  $v78a$25 mm$v78a$,
  $v78b$250 mm$v78b$,
  $v78c$0.25 mm$v78c$,
  $v78d$2.5 m$v78d$,
  $v78ok$Option A$v78ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v79q$Reading a blueprint scale 1:10 means drawing 1 cm equals:$v79q$,
  c.id,
  $v79ty$aptitude$v79ty$,
  $v79a$1 cm real$v79a$,
  $v79b$10 cm real$v79b$,
  $v79c$10 m always$v79c$,
  $v79d$1 mm real$v79d$,
  $v79ok$Option B$v79ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v80q$Clamping glued joints until dry prevents:$v80q$,
  c.id,
  $v80ty$aptitude$v80ty$,
  $v80a$Strong bond$v80a$,
  $v80b$Weak misaligned bond$v80b$,
  $v80c$Paint color change$v80c$,
  $v80d$Electrical short$v80d$,
  $v80ok$Option B$v80ok$
FROM courses c WHERE c.course_name = $course$Carpentry$course$ LIMIT 1;

-- Dressmaking (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v81q$Grain line on a pattern aligns with:$v81q$,
  c.id,
  $v81ty$pre-skilled$v81ty$,
  $v81a$Bias only always$v81a$,
  $v81b$Lengthwise fabric grain$v81b$,
  $v81c$Zipper teeth$v81c$,
  $v81d$Buttonholes randomly$v81d$,
  $v81ok$Option B$v81ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v82q$A seam allowance is:$v82q$,
  c.id,
  $v82ty$pre-skilled$v82ty$,
  $v82a$Extra fabric beyond the seam line$v82a$,
  $v82b$The needle only$v82b$,
  $v82c$Thread color$v82c$,
  $v82d$Iron temperature$v82d$,
  $v82ok$Option A$v82ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v83q$Pink shears help reduce:$v83q$,
  c.id,
  $v83ty$pre-skilled$v83ty$,
  $v83a$Electric bills$v83a$,
  $v83b$Fabric fraying$v83b$,
  $v83c$Pattern size$v83c$,
  $v83d$Client height$v83d$,
  $v83ok$Option B$v83ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v84q$Basting stitches are:$v84q$,
  c.id,
  $v84ty$pre-skilled$v84ty$,
  $v84a$Permanent decorative only$v84a$,
  $v84b$Temporary holding stitches$v84b$,
  $v84c$For welding$v84c$,
  $v84d$Electrical grounds$v84d$,
  $v84ok$Option B$v84ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v85q$A zipper foot on a machine helps sew:$v85q$,
  c.id,
  $v85ty$pre-skilled$v85ty$,
  $v85a$Only straight hems far from zipper$v85a$,
  $v85b$Close to zipper coils$v85b$,
  $v85c$Metal pipes$v85c$,
  $v85d$Food products$v85d$,
  $v85ok$Option B$v85ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v86q$Natural fiber examples include:$v86q$,
  c.id,
  $v86ty$pre-skilled$v86ty$,
  $v86a$Polyester only$v86a$,
  $v86b$Cotton and linen$v86b$,
  $v86c$PVC$v86c$,
  $v86d$Nylon only$v86d$,
  $v86ok$Option B$v86ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v87q$Pressing seams open with iron:$v87q$,
  c.id,
  $v87ty$pre-skilled$v87ty$,
  $v87a$Melts all fabric always$v87a$,
  $v87b$Sets stitches flat for finish$v87b$,
  $v87c$Replaces sewing$v87c$,
  $v87d$Cuts patterns$v87d$,
  $v87ok$Option B$v87ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v88q$Taking body measurements should be done:$v88q$,
  c.id,
  $v88ty$pre-skilled$v88ty$,
  $v88a$Over bulky coat always$v88a$,
  $v88b$Snug and consistent$v88b$,
  $v88c$Without tape$v88c$,
  $v88d$Only after cutting$v88d$,
  $v88ok$Option B$v88ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v89q$Notches on patterns mark:$v89q$,
  c.id,
  $v89ty$pre-skilled$v89ty$,
  $v89a$Fabric price$v89a$,
  $v89b$Matching points$v89b$,
  $v89c$Thread brand$v89c$,
  $v89d$Machine oil$v89d$,
  $v89ok$Option B$v89ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v90q$A serger (overlock) mainly:$v90q$,
  c.id,
  $v90ty$pre-skilled$v90ty$,
  $v90a$Cuts wood$v90a$,
  $v90b$Finishes edges and prevents fray$v90b$,
  $v90c$Pumps water$v90c$,
  $v90d$Tests voltage$v90d$,
  $v90ok$Option B$v90ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v91q$Fabric is 150 cm wide and you need 3 m length. Area used is:$v91q$,
  c.id,
  $v91ty$aptitude$v91ty$,
  $v91a$150 sq cm$v91a$,
  $v91b$4.5 sq m$v91b$,
  $v91c$450 sq cm$v91c$,
  $v91d$0.45 sq m$v91d$,
  $v91ok$Option B$v91ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v92q$If waist is 70 cm and ease is 2 cm, minimum band is:$v92q$,
  c.id,
  $v92ty$aptitude$v92ty$,
  $v92a$68 cm$v92a$,
  $v92b$72 cm$v92b$,
  $v92c$140 cm$v92c$,
  $v92d$35 cm$v92d$,
  $v92ok$Option B$v92ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v93q$Sewing machine needle too large for thin fabric may:$v93q$,
  c.id,
  $v93ty$aptitude$v93ty$,
  $v93a$Improve drape$v93a$,
  $v93b$Leave holes and puckers$v93b$,
  $v93c$Change color$v93c$,
  $v93d$Balance tires$v93d$,
  $v93ok$Option B$v93ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v94q$25% extra fabric for matching plaids means buy:$v94q$,
  c.id,
  $v94ty$aptitude$v94ty$,
  $v94a$Less fabric$v94a$,
  $v94b$1.25 times calculated amount$v94b$,
  $v94c$No pattern$v94c$,
  $v94d$Only thread$v94d$,
  $v94ok$Option B$v94ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v95q$Client wants hem 5 cm shorter on skirt. You measure from:$v95q$,
  c.id,
  $v95ty$aptitude$v95ty$,
  $v95a$Ceiling$v95a$,
  $v95b$Existing hem or marked line$v95b$,
  $v95c$Other person's shoe$v95c$,
  $v95d$Machine serial$v95d$,
  $v95ok$Option B$v95ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v96q$Thread tension too tight causes:$v96q$,
  c.id,
  $v96ty$aptitude$v96ty$,
  $v96a$Loose balanced stitches$v96a$,
  $v96b$Puckering and breakage$v96b$,
  $v96c$Better stretch always$v96c$,
  $v96d$Metal rust$v96d$,
  $v96ok$Option B$v96ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v97q$Converting 1 inch ≈ 2.54 cm means 10 inches is about:$v97q$,
  c.id,
  $v97ty$aptitude$v97ty$,
  $v97a$25.4 cm$v97a$,
  $v97b$10 cm$v97b$,
  $v97c$5.4 cm$v97c$,
  $v97d$100 cm$v97d$,
  $v97ok$Option A$v97ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v98q$Laying pattern on fold saves fabric by:$v98q$,
  c.id,
  $v98ty$aptitude$v98ty$,
  $v98a$Cutting two halves at once symmetrically$v98a$,
  $v98b$Using more scraps randomly$v98b$,
  $v98c$Skipping seams$v98c$,
  $v98d$Burning edges$v98d$,
  $v98ok$Option A$v98ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v99q$A stain on white fabric before construction should be:$v99q$,
  c.id,
  $v99ty$aptitude$v99ty$,
  $v99a$Ignored$v99a$,
  $v99b$Treated or fabric replaced$v99b$,
  $v99c$Painted over$v99c$,
  $v99d$Welded$v99d$,
  $v99ok$Option B$v99ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v100q$Schedule: 2 hours cutting + 4 hours sewing = total:$v100q$,
  c.id,
  $v100ty$aptitude$v100ty$,
  $v100a$5 hours$v100a$,
  $v100b$6 hours$v100b$,
  $v100c$8 hours$v100c$,
  $v100d$2 hours$v100d$,
  $v100ok$Option B$v100ok$
FROM courses c WHERE c.course_name = $course$Dressmaking$course$ LIMIT 1;

-- Drafting (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v101q$A scale ruler on drawings shows:$v101q$,
  c.id,
  $v101ty$pre-skilled$v101ty$,
  $v101a$Real-world proportion reduced$v101a$,
  $v101b$Paint color$v101b$,
  $v101c$Music tempo$v101c$,
  $v101d$Battery amps$v101d$,
  $v101ok$Option A$v101ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v102q$Hidden lines in orthographic views represent:$v102q$,
  c.id,
  $v102ty$pre-skilled$v102ty$,
  $v102a$Visible edges only$v102a$,
  $v102b$Features not seen in that view$v102b$,
  $v102c$Title block$v102c$,
  $v102d$North arrow only$v102d$,
  $v102ok$Option B$v102ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v103q$CAD stands for:$v103q$,
  c.id,
  $v103ty$pre-skilled$v103ty$,
  $v103a$Computer-Aided Design$v103a$,
  $v103b$Central Air Duct$v103b$,
  $v103c$Chemical Analysis Device$v103c$,
  $v103d$Cut And Drill$v103d$,
  $v103ok$Option A$v103ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v104q$First-angle vs third-angle projection differs in:$v104q$,
  c.id,
  $v104ty$pre-skilled$v104ty$,
  $v104a$Paper color$v104a$,
  $v104b$Placement of views$v104b$,
  $v104c$Thread type$v104c$,
  $v104d$Soil pH$v104d$,
  $v104ok$Option B$v104ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v105q$A compass draws:$v105q$,
  c.id,
  $v105ty$pre-skilled$v105ty$,
  $v105a$Square only$v105a$,
  $v105b$Circles and arcs$v105b$,
  $v105c$3D prints$v105c$,
  $v105d$Welds only$v105d$,
  $v105ok$Option B$v105ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v106q$Dimension lines should have:$v106q$,
  c.id,
  $v106ty$pre-skilled$v106ty$,
  $v106a$No units$v106a$,
  $v106b$Clear arrows and numeric size$v106b$,
  $v106c$Only colors$v106c$,
  $v106d$Random angles$v106d$,
  $v106ok$Option B$v106ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v107q$Section view shows:$v107q$,
  c.id,
  $v107ty$pre-skilled$v107ty$,
  $v107a$Interior as if cut$v107a$,
  $v107b$Only exterior paint$v107b$,
  $v107c$Client name$v107c$,
  $v107d$Zip code$v107d$,
  $v107ok$Option A$v107ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v108q$Title block typically includes:$v108q$,
  c.id,
  $v108ty$pre-skilled$v108ty$,
  $v108a$Recipe$v108a$,
  $v108b$Drawing name, scale, date$v108b$,
  $v108c$Hair color$v108c$,
  $v108d$Tire pressure$v108d$,
  $v108ok$Option B$v108ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v109q$Lettering on technical drawings should be:$v109q$,
  c.id,
  $v109ty$pre-skilled$v109ty$,
  $v109a$Illegible$v109a$,
  $v109b$Legible and consistent$v109b$,
  $v109c$Only cursive$v109c$,
  $v109d$Invisible$v109d$,
  $v109ok$Option B$v109ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v110q$An isometric drawing shows:$v110q$,
  c.id,
  $v110ty$pre-skilled$v110ty$,
  $v110a$One face only flat$v110a$,
  $v110b$3D on 2D with parallel axes$v110b$,
  $v110c$Soil layers$v110c$,
  $v110d$Circuit amps only$v110d$,
  $v110ok$Option B$v110ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v111q$Scale 1:50 means 1 cm on paper equals:$v111q$,
  c.id,
  $v111ty$aptitude$v111ty$,
  $v111a$1 cm real$v111a$,
  $v111b$50 cm real$v111b$,
  $v111c$50 m always$v111c$,
  $v111d$5 mm real$v111d$,
  $v111ok$Option B$v111ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v112q$Room 4 m × 3 m floor area is:$v112q$,
  c.id,
  $v112ty$aptitude$v112ty$,
  $v112a$7 m²$v112a$,
  $v112b$12 m²$v112b$,
  $v112c$14 m²$v112c$,
  $v112d$1.33 m²$v112d$,
  $v112ok$Option B$v112ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v113q$If north arrow rotates, views should:$v113q$,
  c.id,
  $v113ty$aptitude$v113ty$,
  $v113a$Stay consistent with orientation$v113a$,
  $v113b$Delete dimensions$v113b$,
  $v113c$Change scale randomly$v113c$,
  $v113d$Remove title$v113d$,
  $v113ok$Option A$v113ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v114q$Converting 5000 mm to meters:$v114q$,
  c.id,
  $v114ty$aptitude$v114ty$,
  $v114a$0.5 m$v114a$,
  $v114b$5 m$v114b$,
  $v114c$50 m$v114c$,
  $v114d$500 m$v114d$,
  $v114ok$Option B$v114ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v115q$Overlapping dimension lines cause:$v115q$,
  c.id,
  $v115ty$aptitude$v115ty$,
  $v115a$Clear reading$v115a$,
  $v115b$Confusion and errors$v115b$,
  $v115c$Better welding$v115c$,
  $v115d$Faster haircuts$v115d$,
  $v115ok$Option B$v115ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v116q$Checking a print against site measurements prevents:$v116q$,
  c.id,
  $v116ty$aptitude$v116ty$,
  $v116a$Accurate construction$v116a$,
  $v116b$Costly field mistakes$v116b$,
  $v116c$Better soil$v116c$,
  $v116d$Nail polish$v116d$,
  $v116ok$Option B$v116ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v117q$Half of 90 degrees is:$v117q$,
  c.id,
  $v117ty$aptitude$v117ty$,
  $v117a$30°$v117a$,
  $v117b$45°$v117b$,
  $v117c$60°$v117c$,
  $v117d$180°$v117d$,
  $v117ok$Option B$v117ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v118q$Revision cloud on a drawing indicates:$v118q$,
  c.id,
  $v118ty$aptitude$v118ty$,
  $v118a$Deleted building$v118a$,
  $v118b$Changed area$v118b$,
  $v118c$North pole$v118c$,
  $v118d$Food zone$v118d$,
  $v118ok$Option B$v118ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v119q$Layer standards in CAD help:$v119q$,
  c.id,
  $v119ty$aptitude$v119ty$,
  $v119a$Hide organization$v119a$,
  $v119b$Organize object types$v119b$,
  $v119c$Remove scale$v119c$,
  $v119d$Block internet$v119d$,
  $v119ok$Option B$v119ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v120q$A wall drawn 6 mm thick at 1:100 represents:$v120q$,
  c.id,
  $v120ty$aptitude$v120ty$,
  $v120a$6 mm real$v120a$,
  $v120b$600 mm real$v120b$,
  $v120c$6 m real$v120c$,
  $v120d$60 m real$v120d$,
  $v120ok$Option B$v120ok$
FROM courses c WHERE c.course_name = $course$Drafting$course$ LIMIT 1;

-- Electricity (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v121q$The unit of electric current is:$v121q$,
  c.id,
  $v121ty$pre-skilled$v121ty$,
  $v121a$Volt$v121a$,
  $v121b$Ampere$v121b$,
  $v121c$Ohm$v121c$,
  $v121d$Watt$v121d$,
  $v121ok$Option B$v121ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v122q$A circuit breaker protects by:$v122q$,
  c.id,
  $v122ty$pre-skilled$v122ty$,
  $v122a$Increasing voltage always$v122a$,
  $v122b$Opening when current is excessive$v122b$,
  $v122c$Storing water$v122c$,
  $v122d$Cooling motors only$v122d$,
  $v122ok$Option B$v122ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v123q$Green or green-yellow wire is typically:$v123q$,
  c.id,
  $v123ty$pre-skilled$v123ty$,
  $v123a$Live/hot$v123a$,
  $v123b$Ground/earth$v123b$,
  $v123c$Neutral only in all countries$v123c$,
  $v123d$Data line$v123d$,
  $v123ok$Option B$v123ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v124q$Ohm's law relates:$v124q$,
  c.id,
  $v124ty$pre-skilled$v124ty$,
  $v124a$V, I, R$v124a$,
  $v124b$Weight, mass, volume$v124b$,
  $v124c$Heat, light, sound only$v124c$,
  $v124d$RPM, torque, HP only$v124d$,
  $v124ok$Option A$v124ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v125q$Before working on a panel you should:$v125q$,
  c.id,
  $v125ty$pre-skilled$v125ty$,
  $v125a$Wet hands help$v125a$,
  $v125b$Lock-out / tag-out and verify dead$v125b$,
  $v125c$Use metal ladder in rain$v125c$,
  $v125d$Skip PPE$v125d$,
  $v125ok$Option B$v125ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v126q$A multimeter can measure:$v126q$,
  c.id,
  $v126ty$pre-skilled$v126ty$,
  $v126a$Hair length$v126a$,
  $v126b$Voltage and resistance$v126b$,
  $v126c$Soil taste$v126c$,
  $v126d$Paint viscosity$v126d$,
  $v126ok$Option B$v126ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v127q$Series circuit current is:$v127q$,
  c.id,
  $v127ty$pre-skilled$v127ty$,
  $v127a$Different in each branch always$v127a$,
  $v127b$Same through each component$v127b$,
  $v127c$Zero always$v127c$,
  $v127d$Only AC$v127d$,
  $v127ok$Option B$v127ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v128q$Conduit protects:$v128q$,
  c.id,
  $v128ty$pre-skilled$v128ty$,
  $v128a$Only wood$v128a$,
  $v128b$Wires from damage$v128b$,
  $v128c$Client hair$v128c$,
  $v128d$Crop roots$v128d$,
  $v128ok$Option B$v128ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v129q$AC means current:$v129q$,
  c.id,
  $v129ty$pre-skilled$v129ty$,
  $v129a$Stays constant direction$v129a$,
  $v129b$Reverses direction periodically$v129b$,
  $v129c$Stops forever$v129c$,
  $v129d$Only in batteries$v129d$,
  $v129ok$Option B$v129ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v130q$Wire gauge number: lower number means:$v130q$,
  c.id,
  $v130ty$pre-skilled$v130ty$,
  $v130a$Thinner wire$v130a$,
  $v130b$Thicker wire$v130b$,
  $v130c$No copper$v130c$,
  $v130d$Higher resistance always$v130d$,
  $v130ok$Option B$v130ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v131q$Power 1200 W at 240 V draws current:$v131q$,
  c.id,
  $v131ty$aptitude$v131ty$,
  $v131a$2 A$v131a$,
  $v131b$5 A$v131b$,
  $v131c$10 A$v131c$,
  $v131d$0.5 A$v131d$,
  $v131ok$Option B$v131ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v132q$Water near energized equipment increases risk of:$v132q$,
  c.id,
  $v132ty$aptitude$v132ty$,
  $v132a$Better insulation$v132a$,
  $v132b$Electric shock$v132b$,
  $v132c$Lower bill only$v132c$,
  $v132d$Faster sewing$v132d$,
  $v132ok$Option B$v132ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v133q$Three 100 W bulbs in parallel on 220 V each get:$v133q$,
  c.id,
  $v133ty$aptitude$v133ty$,
  $v133a$Less than rated voltage each$v133a$,
  $v133b$Full line voltage across each$v133b$,
  $v133c$No current$v133c$,
  $v133d$Only DC$v133d$,
  $v133ok$Option B$v133ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v134q$Resistance 10 Ω at 5 V gives current:$v134q$,
  c.id,
  $v134ty$aptitude$v134ty$,
  $v134a$0.5 A$v134a$,
  $v134b$2 A$v134b$,
  $v134c$50 A$v134c$,
  $v134d$15 A$v134d$,
  $v134ok$Option A$v134ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v135q$Reading wiring diagram before install helps:$v135q$,
  c.id,
  $v135ty$aptitude$v135ty$,
  $v135a$Skip grounding$v135a$,
  $v135b$Correct connections$v135b$,
  $v135c$Remove breakers$v135c$,
  $v135d$Paint walls$v135d$,
  $v135ok$Option B$v135ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v136q$If tool cord is frayed you should:$v136q$,
  c.id,
  $v136ty$aptitude$v136ty$,
  $v136a$Tape and use forever$v136a$,
  $v136b$Replace or repair before use$v136b$,
  $v136c$Wet it$v136c$,
  $v136d$Share one glove$v136d$,
  $v136ok$Option B$v136ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v137q$kWh measures:$v137q$,
  c.id,
  $v137ty$aptitude$v137ty$,
  $v137a$Energy consumed over time$v137a$,
  $v137b$Speed only$v137b$,
  $v137c$Pressure$v137c$,
  $v137d$Length$v137d$,
  $v137ok$Option A$v137ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v138q$Polarity matters for:$v138q$,
  c.id,
  $v138ty$aptitude$v138ty$,
  $v138a$Incandescent bulb only always$v138a$,
  $v138b$LED and electronic loads often$v138b$,
  $v138c$Wooden desk$v138c$,
  $v138d$Cotton shirt$v138d$,
  $v138ok$Option B$v138ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v139q$Doubling voltage across fixed resistor doubles:$v139q$,
  c.id,
  $v139ty$aptitude$v139ty$,
  $v139a$Resistance$v139a$,
  $v139b$Current$v139b$,
  $v139c$Mass$v139c$,
  $v139d$Thread count$v139d$,
  $v139ok$Option B$v139ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v140q$GFCI/RCD devices detect:$v140q$,
  c.id,
  $v140ty$aptitude$v140ty$,
  $v140a$Hair color$v140a$,
  $v140b$Ground fault leakage$v140b$,
  $v140c$Wind speed$v140c$,
  $v140d$Fabric grain$v140d$,
  $v140ok$Option B$v140ok$
FROM courses c WHERE c.course_name = $course$Electricity$course$ LIMIT 1;

-- Electronics (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v141q$A resistor limits:$v141q$,
  c.id,
  $v141ty$pre-skilled$v141ty$,
  $v141a$Water flow$v141a$,
  $v141b$Electric current$v141b$,
  $v141c$Sound only$v141c$,
  $v141d$Gravity$v141d$,
  $v141ok$Option B$v141ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v142q$Capacitor stores:$v142q$,
  c.id,
  $v142ty$pre-skilled$v142ty$,
  $v142a$Mechanical energy$v142a$,
  $v142b$Electrical charge$v142b$,
  $v142c$Wood chips$v142c$,
  $v142d$Paint$v142d$,
  $v142ok$Option B$v142ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v143q$LED polarity means:$v143q$,
  c.id,
  $v143ty$pre-skilled$v143ty$,
  $v143a$No direction matters ever$v143a$,
  $v143b$Anode and cathode must be correct$v143b$,
  $v143c$Only AC works$v143c$,
  $v143d$It is a motor$v143d$,
  $v143ok$Option B$v143ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v144q$Soldering iron tip should be:$v144q$,
  c.id,
  $v144ty$pre-skilled$v144ty$,
  $v144a$Dirty and cold$v144a$,
  $v144b$Clean and properly tinned$v144b$,
  $v144c$Used on live mains always$v144c$,
  $v144d$Dipped in oil$v144d$,
  $v144ok$Option B$v144ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v145q$Breadboard is used for:$v145q$,
  c.id,
  $v145ty$pre-skilled$v145ty$,
  $v145a$Cutting bread only$v145a$,
  $v145b$Prototype circuits without soldering$v145b$,
  $v145c$Welding steel$v145c$,
  $v145d$Mixing dye$v145d$,
  $v145ok$Option B$v145ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v146q$Transistor can act as:$v146q$,
  c.id,
  $v146ty$pre-skilled$v146ty$,
  $v146a$Only heater$v146a$,
  $v146b$Switch or amplifier$v146b$,
  $v146c$Hammer$v146c$,
  $v146d$Ruler$v146d$,
  $v146ok$Option B$v146ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v147q$Digital logic 1 and 0 represent:$v147q$,
  c.id,
  $v147ty$pre-skilled$v147ty$,
  $v147a$High and low voltage states$v147a$,
  $v147b$Hot and cold water$v147b$,
  $v147c$Day and night only$v147c$,
  $v147d$Weight units$v147d$,
  $v147ok$Option A$v147ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v148q$Oscilloscope displays:$v148q$,
  c.id,
  $v148ty$pre-skilled$v148ty$,
  $v148a$Voltage over time$v148a$,
  $v148b$Hair length$v148b$,
  $v148c$Soil pH paper color$v148c$,
  $v148d$Tire tread$v148d$,
  $v148ok$Option A$v148ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v149q$ESD strap prevents:$v149q$,
  c.id,
  $v149ty$pre-skilled$v149ty$,
  $v149a$All learning$v149a$,
  $v149b$Static damage to sensitive ICs$v149b$,
  $v149c$Better cooking$v149c$,
  $v149d$Louder music$v149d$,
  $v149ok$Option B$v149ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v150q$Reading resistor color bands gives:$v150q$,
  c.id,
  $v150ty$pre-skilled$v150ty$,
  $v150a$Resistance value$v150a$,
  $v150b$Engine oil grade$v150b$,
  $v150c$Fabric width$v150c$,
  $v150d$Room area$v150d$,
  $v150ok$Option A$v150ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v151q$Series resistors 100 Ω + 200 Ω total:$v151q$,
  c.id,
  $v151ty$aptitude$v151ty$,
  $v151a$150 Ω$v151a$,
  $v151b$300 Ω$v151b$,
  $v151c$66 Ω$v151c$,
  $v151d$20000 Ω$v151d$,
  $v151ok$Option B$v151ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v152q$Reversed LED in simple circuit often:$v152q$,
  c.id,
  $v152ty$aptitude$v152ty$,
  $v152a$Shines brighter$v152a$,
  $v152b$Does not light$v152b$,
  $v152c$Charges battery$v152c$,
  $v152d$Cuts wood$v152d$,
  $v152ok$Option B$v152ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v153q$If supply is 9 V and resistor 3 k ohms, current is about:$v153q$,
  c.id,
  $v153ty$aptitude$v153ty$,
  $v153a$3 mA$v153a$,
  $v153b$3 A$v153b$,
  $v153c$27 A$v153c$,
  $v153d$0 A always$v153d$,
  $v153ok$Option A$v153ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v154q$Flux in soldering helps:$v154q$,
  c.id,
  $v154ty$aptitude$v154ty$,
  $v154a$Rust metal$v154a$,
  $v154b$Wet metal for good joint$v154b$,
  $v154c$Insulate forever$v154c$,
  $v154d$Block heat$v154d$,
  $v154ok$Option B$v154ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v155q$Binary 1010 equals decimal:$v155q$,
  c.id,
  $v155ty$aptitude$v155ty$,
  $v155a$8$v155a$,
  $v155b$10$v155b$,
  $v155c$12$v155c$,
  $v155d$5$v155d$,
  $v155ok$Option B$v155ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v156q$Overheating component smell means:$v156q$,
  c.id,
  $v156ty$aptitude$v156ty$,
  $v156a$Normal always$v156a$,
  $v156b$Stop power and inspect$v156b$,
  $v156c$Add water$v156c$,
  $v156d$Increase voltage$v156d$,
  $v156ok$Option B$v156ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v157q$Parallel identical resistors halve total resistance when:$v157q$,
  c.id,
  $v157ty$aptitude$v157ty$,
  $v157a$Two same value$v157a$,
  $v157b$One only$v157b$,
  $v157c$None$v157c$,
  $v157d$Ten different$v157d$,
  $v157ok$Option A$v157ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v158q$Datasheet shows max current to avoid:$v158q$,
  c.id,
  $v158ty$aptitude$v158ty$,
  $v158a$Reading$v158a$,
  $v158b$Burning out component$v158b$,
  $v158c$Using PCB$v158c$,
  $v158d$Labeling wires$v158d$,
  $v158ok$Option B$v158ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v159q$Logic gate AND outputs 1 when:$v159q$,
  c.id,
  $v159ty$aptitude$v159ty$,
  $v159a$Any input 0$v159a$,
  $v159b$All inputs 1$v159b$,
  $v159c$No power$v159c$,
  $v159d$Random$v159d$,
  $v159ok$Option B$v159ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v160q$Organizing wires by signal and power reduces:$v160q$,
  c.id,
  $v160ty$aptitude$v160ty$,
  $v160a$Function$v160a$,
  $v160b$Noise and mistakes$v160b$,
  $v160c$Cost always to zero$v160c$,
  $v160d$Screen size$v160d$,
  $v160ok$Option B$v160ok$
FROM courses c WHERE c.course_name = $course$Electronics$course$ LIMIT 1;

-- Food Tech (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v161q$HACCP focuses on:$v161q$,
  c.id,
  $v161ty$pre-skilled$v161ty$,
  $v161a$Food safety hazards control$v161a$,
  $v161b$Car engine tune-up$v161b$,
  $v161c$Hair styling$v161c$,
  $v161d$Welding rods$v161d$,
  $v161ok$Option A$v161ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v162q$Cross-contamination is prevented by:$v162q$,
  c.id,
  $v162ty$pre-skilled$v162ty$,
  $v162a$Same board for raw and cooked$v162a$,
  $v162b$Separate utensils and surfaces$v162b$,
  $v162c$Room temperature storage long term$v162c$,
  $v162d$Skipping hand wash$v162d$,
  $v162ok$Option B$v162ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v163q$Blanching vegetables briefly in boiling water helps:$v163q$,
  c.id,
  $v163ty$pre-skilled$v163ty$,
  $v163a$Remove all nutrients always$v163a$,
  $v163b$Set color and reduce enzymes$v163b$,
  $v163c$Add bacteria$v163c$,
  $v163d$Freeze metal$v163d$,
  $v163ok$Option B$v163ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v164q$Mise en place means:$v164q$,
  c.id,
  $v164ty$pre-skilled$v164ty$,
  $v164a$Everything in its place before cooking$v164a$,
  $v164b$Burning food$v164b$,
  $v164c$Selling only drinks$v164c$,
  $v164d$Measuring voltage$v164d$,
  $v164ok$Option A$v164ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v165q$Safe internal temperature for cooked chicken is about:$v165q$,
  c.id,
  $v165ty$pre-skilled$v165ty$,
  $v165a$20 degrees C$v165a$,
  $v165b$74 degrees C$v165b$,
  $v165c$10 degrees C$v165c$,
  $v165d$Room temperature only$v165d$,
  $v165ok$Option B$v165ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v166q$Yeast in bread produces:$v166q$,
  c.id,
  $v166ty$pre-skilled$v166ty$,
  $v166a$CO2 gas for leavening$v166a$,
  $v166b$Metal rust$v166b$,
  $v166c$Plastic$v166c$,
  $v166d$AC current$v166d$,
  $v166ok$Option A$v166ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v167q$Emulsion example is:$v167q$,
  c.id,
  $v167ty$pre-skilled$v167ty$,
  $v167a$Oil and water mixed like mayonnaise$v167a$,
  $v167b$Dry rice only$v167b$,
  $v167c$Solid steel$v167c$,
  $v167d$Empty pan$v167d$,
  $v167ok$Option A$v167ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v168q$Refrigerator storage keeps food:$v168q$,
  c.id,
  $v168ty$pre-skilled$v168ty$,
  $v168a$In danger zone longer$v168a$,
  $v168b$Below bacterial rapid growth temps$v168b$,
  $v168c$Hot always$v168c$,
  $v168d$Frozen solid only$v168d$,
  $v168ok$Option B$v168ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v169q$Knife sharpening steel realigns:$v169q$,
  c.id,
  $v169ty$pre-skilled$v169ty$,
  $v169a$Engine piston$v169a$,
  $v169b$Blade edge$v169b$,
  $v169c$Circuit trace$v169c$,
  $v169d$Pipe thread$v169d$,
  $v169ok$Option B$v169ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v170q$Standardized recipes ensure:$v170q$,
  c.id,
  $v170ty$pre-skilled$v170ty$,
  $v170a$Random taste each batch$v170a$,
  $v170b$Consistent quality and cost control$v170b$,
  $v170c$No measuring$v170c$,
  $v170d$Only frying$v170d$,
  $v170ok$Option B$v170ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v171q$A recipe serves 4 portions. You need 12 portions. Multiply ingredients by:$v171q$,
  c.id,
  $v171ty$aptitude$v171ty$,
  $v171a$2$v171a$,
  $v171b$3$v171b$,
  $v171c$4$v171c$,
  $v171d$0.5$v171d$,
  $v171ok$Option B$v171ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v172q$Thawing frozen meat at room temperature for hours is:$v172q$,
  c.id,
  $v172ty$aptitude$v172ty$,
  $v172a$Best practice$v172a$,
  $v172b$Unsafe; use fridge or controlled methods$v172b$,
  $v172c$Required for salad$v172c$,
  $v172d$Same as cooking$v172d$,
  $v172ok$Option B$v172ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v173q$250 mL is equal to:$v173q$,
  c.id,
  $v173ty$aptitude$v173ty$,
  $v173a$0.25 L$v173a$,
  $v173b$2.5 L$v173b$,
  $v173c$25 L$v173c$,
  $v173d$0.025 L$v173d$,
  $v173ok$Option A$v173ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v174q$Bitter taste in burnt garlic means:$v174q$,
  c.id,
  $v174ty$aptitude$v174ty$,
  $v174a$Perfect$v174a$,
  $v174b$Overcooked; start again or adjust$v174b$,
  $v174c$More sugar only fix$v174c$,
  $v174d$Add oil to extinguish$v174d$,
  $v174ok$Option B$v174ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v175q$If food costs 80 pesos and sells for 200 pesos, food cost percent is:$v175q$,
  c.id,
  $v175ty$aptitude$v175ty$,
  $v175a$40%$v175a$,
  $v175b$80%$v175b$,
  $v175c$120%$v175c$,
  $v175d$20%$v175d$,
  $v175ok$Option A$v175ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v176q$Wet hands handling electrical kitchen equipment is:$v176q$,
  c.id,
  $v176ty$aptitude$v176ty$,
  $v176a$Safe$v176a$,
  $v176b$Hazardous$v176b$,
  $v176c$Required$v176c$,
  $v176d$Faster cooling$v176d$,
  $v176ok$Option B$v176ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v177q$FIFO stock rotation means use:$v177q$,
  c.id,
  $v177ty$aptitude$v177ty$,
  $v177a$Newest first$v177a$,
  $v177b$Oldest first$v177b$,
  $v177c$Random cans$v177c$,
  $v177d$Expired first$v177d$,
  $v177ok$Option B$v177ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v178q$Doubling a cake recipe may need:$v178q$,
  c.id,
  $v178ty$aptitude$v178ty$,
  $v178a$Same pan time always$v178a$,
  $v178b$Adjusted time and pan size$v178b$,
  $v178c$No oven$v178c$,
  $v178d$Half heat$v178d$,
  $v178ok$Option B$v178ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v179q$Sanitizer concentration too weak will:$v179q$,
  c.id,
  $v179ty$aptitude$v179ty$,
  $v179a$Kill all germs surely$v179a$,
  $v179b$Fail to sanitize properly$v179b$,
  $v179c$Improve flavor$v179c$,
  $v179d$Weld pans$v179d$,
  $v179ok$Option B$v179ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v180q$3 hours prep + 1 hour cook for event needs start:$v180q$,
  c.id,
  $v180ty$aptitude$v180ty$,
  $v180a$1 hour before$v180a$,
  $v180b$4 hours before service$v180b$,
  $v180c$After eating$v180c$,
  $v180d$Next day only$v180d$,
  $v180ok$Option B$v180ok$
FROM courses c WHERE c.course_name = $course$Food Tech$course$ LIMIT 1;

-- ICT (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v181q$CPU stands for:$v181q$,
  c.id,
  $v181ty$pre-skilled$v181ty$,
  $v181a$Central Processing Unit$v181a$,
  $v181b$Computer Personal Utility$v181b$,
  $v181c$Cable Power Unit$v181c$,
  $v181d$Central Print Upgrade$v181d$,
  $v181ok$Option A$v181ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v182q$RAM is:$v182q$,
  c.id,
  $v182ty$pre-skilled$v182ty$,
  $v182a$Permanent storage only$v182a$,
  $v182b$Volatile memory for active tasks$v182b$,
  $v182c$Monitor brand$v182c$,
  $v182d$Printer ink$v182d$,
  $v182ok$Option B$v182ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v183q$HTTPS indicates:$v183q$,
  c.id,
  $v183ty$pre-skilled$v183ty$,
  $v183a$Unencrypted web$v183a$,
  $v183b$Encrypted web traffic$v183b$,
  $v183c$Offline mode$v183c$,
  $v183d$Paper protocol$v183d$,
  $v183ok$Option B$v183ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v184q$A router connects:$v184q$,
  c.id,
  $v184ty$pre-skilled$v184ty$,
  $v184a$Only keyboards$v184a$,
  $v184b$Networks and routes packets$v184b$,
  $v184c$Welding torch$v184c$,
  $v184d$Water pipes$v184d$,
  $v184ok$Option B$v184ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v185q$Phishing is:$v185q$,
  c.id,
  $v185ty$pre-skilled$v185ty$,
  $v185a$Fish cooking$v185a$,
  $v185b$Trick to steal credentials$v185b$,
  $v185c$Hardware upgrade$v185c$,
  $v185d$Cable type$v185d$,
  $v185ok$Option B$v185ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v186q$Backup copies data to:$v186q$,
  c.id,
  $v186ty$pre-skilled$v186ty$,
  $v186a$Nowhere$v186a$,
  $v186b$Secondary location or media$v186b$,
  $v186c$Delete drive only$v186c$,
  $v186d$RAM permanently$v186d$,
  $v186ok$Option B$v186ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v187q$OS examples include:$v187q$,
  c.id,
  $v187ty$pre-skilled$v187ty$,
  $v187a$Windows, Linux, macOS$v187a$,
  $v187b$Only Microsoft Word$v187b$,
  $v187c$HDMI cable$v187c$,
  $v187d$Solder wire$v187d$,
  $v187ok$Option A$v187ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v188q$Binary uses digits:$v188q$,
  c.id,
  $v188ty$pre-skilled$v188ty$,
  $v188a$0 and 1$v188a$,
  $v188b$1 to 9 only$v188b$,
  $v188c$A to F only$v188c$,
  $v188d$Colors$v188d$,
  $v188ok$Option A$v188ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v189q$Spreadsheet cell A1 refers to:$v189q$,
  c.id,
  $v189ty$pre-skilled$v189ty$,
  $v189a$Column A row 1$v189a$,
  $v189b$Row A column 1$v189b$,
  $v189c$Printer tray$v189c$,
  $v189d$USB port$v189d$,
  $v189ok$Option A$v189ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v190q$Strong password should be:$v190q$,
  c.id,
  $v190ty$pre-skilled$v190ty$,
  $v190a$Your birthday$v190a$,
  $v190b$Long, mixed, unique$v190b$,
  $v190c$password123 for all sites$v190c$,
  $v190d$Written on monitor$v190d$,
  $v190ok$Option B$v190ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v191q$1 GB ≈ how many MB (decimal common use)?$v191q$,
  c.id,
  $v191ty$aptitude$v191ty$,
  $v191a$100$v191a$,
  $v191b$1000$v191b$,
  $v191c$1024 in binary context often$v191c$,
  $v191d$10$v191d$,
  $v191ok$Option C$v191ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v192q$If download is 50 MB/s, 200 MB file takes about:$v192q$,
  c.id,
  $v192ty$aptitude$v192ty$,
  $v192a$1 second$v192a$,
  $v192b$4 seconds$v192b$,
  $v192c$10 minutes$v192c$,
  $v192d$1 hour$v192d$,
  $v192ok$Option B$v192ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v193q$Opening unknown email attachment may:$v193q$,
  c.id,
  $v193ty$aptitude$v193ty$,
  $v193a$Speed PC always$v193a$,
  $v193b$Install malware$v193b$,
  $v193c$Clean virus$v193c$,
  $v193d$Fix Wi-Fi$v193d$,
  $v193ok$Option B$v193ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v194q$IP address 192.168.1.10 is likely:$v194q$,
  c.id,
  $v194ty$aptitude$v194ty$,
  $v194a$Public internet only$v194a$,
  $v194b$Private local network$v194b$,
  $v194c$GPS coordinate$v194c$,
  $v194d$Temperature$v194d$,
  $v194ok$Option B$v194ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v195q$Ctrl+S in most apps:$v195q$,
  c.id,
  $v195ty$aptitude$v195ty$,
  $v195a$Deletes file$v195a$,
  $v195b$Saves$v195b$,
  $v195c$Shuts PC$v195c$,
  $v195d$Formats disk$v195d$,
  $v195ok$Option B$v195ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v196q$If 8 bits = 1 byte, 16 bits =$v196q$,
  c.id,
  $v196ty$aptitude$v196ty$,
  $v196a$1 byte$v196a$,
  $v196b$2 bytes$v196b$,
  $v196c$16 bytes$v196c$,
  $v196d$4 bytes$v196d$,
  $v196ok$Option B$v196ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v197q$Cloud storage means files on:$v197q$,
  c.id,
  $v197ty$aptitude$v197ty$,
  $v197a$Only floppy disk$v197a$,
  $v197b$Remote servers accessible online$v197b$,
  $v197c$Inside mouse$v197c$,
  $v197d$Paper only$v197d$,
  $v197ok$Option B$v197ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v198q$Troubleshoot no internet: logical first step:$v198q$,
  c.id,
  $v198ty$aptitude$v198ty$,
  $v198a$Replace monitor$v198a$,
  $v198b$Check cable/Wi-Fi and router$v198b$,
  $v198c$Reinstall OS immediately$v198c$,
  $v198d$Buy new chair$v198d$,
  $v198ok$Option B$v198ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v199q$Version control (e.g. Git) helps:$v199q$,
  c.id,
  $v199ty$aptitude$v199ty$,
  $v199a$Cook food$v199a$,
  $v199b$Track code changes$v199b$,
  $v199c$Paint walls$v199c$,
  $v199d$Grow rice$v199d$,
  $v199ok$Option B$v199ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v200q$Recycling e-waste properly prevents:$v200q$,
  c.id,
  $v200ty$aptitude$v200ty$,
  $v200a$Better FPS$v200a$,
  $v200b$Environmental harm$v200b$,
  $v200c$Faster typing only$v200c$,
  $v200d$Hair damage$v200d$,
  $v200ok$Option B$v200ok$
FROM courses c WHERE c.course_name = $course$ICT$course$ LIMIT 1;

-- SMAW (20 questions)
INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v201q$SMAW stands for:$v201q$,
  c.id,
  $v201ty$pre-skilled$v201ty$,
  $v201a$Shielded Metal Arc Welding$v201a$,
  $v201b$Soft Metal Assembly Work$v201b$,
  $v201c$Standard Motor Air Wiring$v201c$,
  $v201d$Steel Measure And Weld$v201d$,
  $v201ok$Option A$v201ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v202q$Welding helmet protects from:$v202q$,
  c.id,
  $v202ty$pre-skilled$v202ty$,
  $v202a$Only rain$v202a$,
  $v202b$Arc flash and sparks$v202b$,
  $v202c$Sound only$v202c$,
  $v202d$Paper cuts$v202d$,
  $v202ok$Option B$v202ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v203q$Electrode coating provides:$v203q$,
  c.id,
  $v203ty$pre-skilled$v203ty$,
  $v203a$Shielding gas and slag$v203a$,
  $v203b$Paint color only$v203b$,
  $v203c$Fuel for engine$v203c$,
  $v203d$Coolant for PC$v203d$,
  $v203ok$Option A$v203ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v204q$Work clamp (ground) attaches to:$v204q$,
  c.id,
  $v204ty$pre-skilled$v204ty$,
  $v204a$Electrode holder only$v204a$,
  $v204b$Workpiece or table$v204b$,
  $v204c$Helmet$v204c$,
  $v204d$Water hose$v204d$,
  $v204ok$Option B$v204ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v205q$Arc length should generally be:$v205q$,
  c.id,
  $v205ty$pre-skilled$v205ty$,
  $v205a$Very long$v205a$,
  $v205b$About equal to electrode diameter$v205b$,
  $v205c$Zero$v205c$,
  $v205d$One meter$v205d$,
  $v205ok$Option B$v205ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v206q$Slag after welding should be:$v206q$,
  c.id,
  $v206ty$pre-skilled$v206ty$,
  $v206a$Left forever$v206a$,
  $v206b$Removed after cooling$v206b$,
  $v206c$Eaten$v206c$,
  $v206d$Poured in fuel tank$v206d$,
  $v206ok$Option B$v206ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v207q$6013 electrode is often used for:$v207q$,
  c.id,
  $v207ty$pre-skilled$v207ty$,
  $v207a$Underwater only$v207a$,
  $v207b$General purpose mild steel$v207b$,
  $v207c$Wood joinery$v207c$,
  $v207d$Hair coloring$v207d$,
  $v207ok$Option B$v207ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v208q$Ventilation during welding reduces:$v208q$,
  c.id,
  $v208ty$pre-skilled$v208ty$,
  $v208a$Skill$v208a$,
  $v208b$Fume inhalation risk$v208b$,
  $v208c$Arc visibility always$v208c$,
  $v208d$Metal strength always$v208d$,
  $v208ok$Option B$v208ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v209q$Polarity affects:$v209q$,
  c.id,
  $v209ty$pre-skilled$v209ty$,
  $v209a$Only paint$v209a$,
  $v209b$Penetration and bead shape$v209b$,
  $v209c$Soil pH$v209c$,
  $v209d$Thread count$v209d$,
  $v209ok$Option B$v209ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v210q$Hot metal after welding should be:$v210q$,
  c.id,
  $v210ty$pre-skilled$v210ty$,
  $v210a$Touched to test$v210a$,
  $v210b$Marked hot and cooled safely$v210b$,
  $v210c$Sprayed with water on hot weld always$v210c$,
  $v210d$Hidden under paper$v210d$,
  $v210ok$Option B$v210ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v211q$Welding near flammable liquids is:$v211q$,
  c.id,
  $v211ty$aptitude$v211ty$,
  $v211a$Safe$v211a$,
  $v211b$Extremely dangerous$v211b$,
  $v211c$Required$v211c$,
  $v211d$Good for speed$v211d$,
  $v211ok$Option B$v211ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v212q$If machine shows 120 A and duty cycle 20%, long welds need:$v212q$,
  c.id,
  $v212ty$aptitude$v212ty$,
  $v212a$No breaks ever$v212a$,
  $v212b$Cool-down periods$v212b$,
  $v212c$Higher amps only$v212c$,
  $v212d$Remove ground$v212d$,
  $v212ok$Option B$v212ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v213q$Distortion in thin plate can be reduced by:$v213q$,
  c.id,
  $v213ty$aptitude$v213ty$,
  $v213a$More heat everywhere$v213a$,
  $v213b$Tack welds and balanced sequence$v213b$,
  $v213c$Skip PPE$v213c$,
  $v213d$Faster travel only always$v213d$,
  $v213ok$Option B$v213ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v214q$Oily metal before weld should be:$v214q$,
  c.id,
  $v214ty$aptitude$v214ty$,
  $v214a$Left as is$v214a$,
  $v214b$Cleaned$v214b$,
  $v214c$Painted thick$v214c$,
  $v214d$Wet with soap$v214d$,
  $v214ok$Option B$v214ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v215q$Welding galvanized steel without proper protection risks:$v215q$,
  c.id,
  $v215ty$aptitude$v215ty$,
  $v215a$Better beads only$v215a$,
  $v215b$Toxic fume exposure$v215b$,
  $v215c$Lower amps always$v215c$,
  $v215d$No hazard$v215d$,
  $v215ok$Option B$v215ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v216q$Two 3 mm plates lap joint: electrode size often near:$v216q$,
  c.id,
  $v216ty$aptitude$v216ty$,
  $v216a$1 mm only$v216a$,
  $v216b$3.2 mm class common$v216b$,
  $v216c$20 mm$v216c$,
  $v216d$0.5 mm$v216d$,
  $v216ok$Option B$v216ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v217q$Fire extinguisher type for electrical fire class (check label) often:$v217q$,
  c.id,
  $v217ty$aptitude$v217ty$,
  $v217a$Water only always$v217a$,
  $v217b$CO2 or dry chemical suitable$v217b$,
  $v217c$Cooking oil only$v217c$,
  $v217d$Paper only$v217d$,
  $v217ok$Option B$v217ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v218q$Travel speed too slow causes:$v218q$,
  c.id,
  $v218ty$aptitude$v218ty$,
  $v218a$Narrow bead only$v218a$,
  $v218b$Excessive buildup and undercut risk$v218b$,
  $v218c$No fusion always$v218c$,
  $v218d$Cold weld only$v218d$,
  $v218ok$Option B$v218ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v219q$Inspect weld visually for:$v219q$,
  c.id,
  $v219ty$aptitude$v219ty$,
  $v219a$Hair color$v219a$,
  $v219b$Cracks, porosity, undercut$v219b$,
  $v219c$Fabric grain$v219c$,
  $v219d$CPU speed$v219d$,
  $v219ok$Option B$v219ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)
SELECT
  $v220q$PPE includes:$v220q$,
  c.id,
  $v220ty$aptitude$v220ty$,
  $v220a$Sandals$v220a$,
  $v220b$Leather gloves, helmet, apron$v220b$,
  $v220c$Swim goggles only$v220c$,
  $v220d$None$v220d$,
  $v220ok$Option B$v220ok$
FROM courses c WHERE c.course_name = $course$SMAW$course$ LIMIT 1;

-- Verify counts (expect 20 per course):
SELECT c.course_name, COUNT(q.id) AS question_count
FROM courses c
LEFT JOIN questions q ON q.course_id = c.id
WHERE c.course_name IN ($c$Automotive$c$, $c$Agriculture$c$, $c$Beauty Care$c$, $c$Carpentry$c$, $c$Dressmaking$c$, $c$Drafting$c$, $c$Electricity$c$, $c$Electronics$c$, $c$Food Tech$c$, $c$ICT$c$, $c$SMAW$c$)
GROUP BY c.course_name
ORDER BY c.course_name;
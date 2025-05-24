// import { getAllAbstracts, getHypothesesByComplexity, addHypothesis } from '../../lib/database.js';
// import { isHypothesisSupported } from '../../lib/nlp.js';
// // import { isHypothesisSupported } from '../../lib/nlp.ts';

// interface HypothesisResult {
//   id: number;
//   text: string;
//   complexity: number;
//   isSupported: boolean;
// }

// /**
//  * Generate hypotheses at a specified complexity level
//  */
// export async function generateHypotheses(complexity: number): Promise<HypothesisResult[]> {
//   // Validate complexity
//   if (complexity < 2 || complexity > 5) {
//     throw new Error('Complexity must be between 2 and 5');
//   }
  
//   // Check if we already have hypotheses for this complexity
//   const existingHypotheses = getHypothesesByComplexity(complexity);
//   if (existingHypotheses.length >= 10) {
//     return existingHypotheses.slice(0, 10).map(h => ({
//       id: h.id,
//       text: h.text,
//       complexity: h.complexity,
//       isSupported: h.isSupported
//     }));
//   }
  
//   // Get all abstracts for checking support
//   const abstracts = getAllAbstracts();
  
//   // Generate new hypotheses based on complexity
//   const generatedHypotheses = generateHypothesesForComplexity(complexity);
//   const results: HypothesisResult[] = [];
  
//   // Check support for each hypothesis and save to database
//   for (const hypothesisText of generatedHypotheses) {
//     const { isSupported, supportingAbstractIds } = isHypothesisSupported(
//       hypothesisText,
//       abstracts.map(a => ({ id: a.id, text: a.text }))
//     );
    
//     // Add hypothesis to database
//     const hypothesisId = addHypothesis(
//       {
//         text: hypothesisText,
//         complexity,
//         isSupported
//       },
//       supportingAbstractIds
//     );
    
//     results.push({
//       id: hypothesisId,
//       text: hypothesisText,
//       complexity,
//       isSupported
//     });
//   }
  
//   // Return results combined with existing hypotheses (up to 10)
//   const combinedResults = [...existingHypotheses, ...results].slice(0, 10);
//   return combinedResults.map(h => ({
//     id: h.id,
//     text: h.text,
//     complexity: h.complexity,
//     isSupported: h.isSupported
//   }));
// }

// /**
//  * Generate hypotheses for a specific complexity level
//  */
// function generateHypothesesForComplexity(complexity: number): string[] {
//   // For the hackathon, we'll use predefined hypotheses for each complexity level
//   // In a real implementation, this would use NLP to generate from actual entities and relations
//   switch (complexity) {
//     case 2:
//       return [
//         "Drought affects photosynthesis",
//         "Jasmonic acid induces stomatal closure",
//         "Abscisic acid regulates transpiration",
//         "Ethylene inhibits root growth",
//         "Calcium signaling mediates stress responses",
//         "ROS activates defense mechanisms",
//         "Salicylic acid enhances pathogen resistance",
//         "Auxin promotes cell elongation",
//         "Cytokinin delays senescence",
//         "Heat stress reduces yield"
//       ];
//     case 3:
//       return [
//         "Jasmonic acid induces stomatal closure during drought",
//         "Abscisic acid activates MAPK signaling in guard cells",
//         "Calcium oscillations regulate stomatal aperture under stress",
//         "ROS production mediates ABA-induced stomatal closure",
//         "Ethylene inhibits root growth during flooding",
//         "Drought stress increases ABA concentration in leaves",
//         "MYC2 transcription factor activates jasmonate responses",
//         "SLAC1 ion channels regulate stomatal closure mechanisms",
//         "Nitric oxide enhances ABA-induced stomatal closure",
//         "H2O2 activates calcium channels in guard cells"
//       ];
//     case 4:
//       return [
//         "Jasmonic acid induces ROS production in guard cells during drought",
//         "ABA-activated SnRK2 kinases phosphorylate SLAC1 channels in stomata",
//         "Calcium-dependent protein kinases regulate anion channels during closure",
//         "MYC2 transcription factor coordinates JA and ABA signaling pathways",
//         "Drought-induced ABA triggers H2O2 production in guard cells",
//         "Ethylene receptors modulate ABA sensitivity in stomatal guard cells",
//         "ROS-activated MAPK cascade regulates ion channel activity in stomata",
//         "JAZ repressors inhibit MYC transcription factors during normal conditions",
//         "Cytosolic calcium oscillations activate SLAC1 channels through CDPK",
//         "ABA induces NO production which enhances stomatal closure mechanisms"
//       ];
//     case 5:
//       return [
//         "Drought-induced ABA activates OST1 kinase which phosphorylates SLAC1 channels",
//         "JA-induced MYC2 activation enhances ABA sensitivity in guard cells during combined stress",
//         "ROS-dependent activation of MAPK cascade leads to calcium release from internal stores",
//         "ABA-induced NO production activates cGMP signaling pathway in guard cells during drought",
//         "Cytosolic calcium oscillations activate CPK6 which phosphorylates SLAC1 in guard cells",
//         "JAZ repressors inhibit MYC2-mediated JA-ABA crosstalk under non-stress conditions",
//         "Drought-induced ROS triggers calcium-dependent protein kinase signaling in stomata",
//         "ABA and JA synergistically regulate SLAC1 through MYC2 and OST1 interaction",
//         "NO-mediated cGMP signaling enhances calcium channel activity in guard cells",
//         "MAPK cascade modulates ABA-induced stomatal closure through ROS amplification"
//       ];
//     default:
//       return [];
//   }
// }


import { getAllAbstracts, getHypothesesByComplexity, addHypothesis, Hypothesis, Abstract } from '../../lib/database.js';
import { isHypothesisSupported } from '../../lib/nlp.js';

interface HypothesisResult {
  id: number;
  text: string;
  complexity: number;
  isSupported: boolean;
}

/**
 * Generate hypotheses at a specified complexity level
 */
export async function generateHypotheses(complexity: number): Promise<HypothesisResult[]> {
  // Validate complexity
  if (complexity < 2 || complexity > 5) {
    throw new Error('Complexity must be between 2 and 5');
  }
  
  // Check if we already have hypotheses for this complexity
  const existingHypotheses = await getHypothesesByComplexity(complexity); // Add await
  if (existingHypotheses.length >= 10) {
    return existingHypotheses.slice(0, 10).map((h: Hypothesis) => ({ // Add type
      id: h.id,
      text: h.text,
      complexity: h.complexity,
      isSupported: h.isSupported
    }));
  }
  
  // Get all abstracts for checking support
  const abstracts = await getAllAbstracts(); // Add await
  
  // Generate new hypotheses based on complexity
  const generatedHypotheses = generateHypothesesForComplexity(complexity);
  const results: HypothesisResult[] = [];
  
  // Check support for each hypothesis and save to database
  for (const hypothesisText of generatedHypotheses) {
    const { isSupported, supportingAbstractIds } = isHypothesisSupported(
      hypothesisText,
      abstracts.map((a: Abstract) => ({ id: a.id, text: a.text })) // Add type
    );
    
    // Add hypothesis to database
    const hypothesisId = await addHypothesis( // Add await
      {
        text: hypothesisText,
        complexity,
        isSupported
      },
      supportingAbstractIds
    );
    
    results.push({
      id: hypothesisId,
      text: hypothesisText,
      complexity,
      isSupported
    });
  }
  
  // Return results combined with existing hypotheses (up to 10)
  const combinedResults = [...existingHypotheses, ...results].slice(0, 10);
  return combinedResults.map((h: Hypothesis | HypothesisResult) => ({ // Add type
    id: h.id,
    text: h.text,
    complexity: h.complexity,
    isSupported: h.isSupported
  }));
}

/**
 * Generate hypotheses for a specific complexity level
 */
function generateHypothesesForComplexity(complexity: number): string[] {
  switch (complexity) {
    case 2:
      return [
        "Drought affects photosynthesis",
        "Jasmonic acid induces stomatal closure",
        "Abscisic acid regulates transpiration",
        "Ethylene inhibits root growth",
        "Calcium signaling mediates stress responses",
        "ROS activates defense mechanisms",
        "Salicylic acid enhances pathogen resistance",
        "Auxin promotes cell elongation",
        "Cytokinin delays senescence",
        "Heat stress reduces yield"
      ];
      case 3:
              return [
                "Jasmonic acid induces stomatal closure during drought",
                "Abscisic acid activates MAPK signaling in guard cells",
                "Calcium oscillations regulate stomatal aperture under stress",
                "ROS production mediates ABA-induced stomatal closure",
                "Ethylene inhibits root growth during flooding",
                "Drought stress increases ABA concentration in leaves",
                "MYC2 transcription factor activates jasmonate responses",
                "SLAC1 ion channels regulate stomatal closure mechanisms",
                "Nitric oxide enhances ABA-induced stomatal closure",
                "H2O2 activates calcium channels in guard cells"
              ];
            case 4:
              return [
                "Jasmonic acid induces ROS production in guard cells during drought",
                "ABA-activated SnRK2 kinases phosphorylate SLAC1 channels in stomata",
                "Calcium-dependent protein kinases regulate anion channels during closure",
                "MYC2 transcription factor coordinates JA and ABA signaling pathways",
                "Drought-induced ABA triggers H2O2 production in guard cells",
                "Ethylene receptors modulate ABA sensitivity in stomatal guard cells",
                "ROS-activated MAPK cascade regulates ion channel activity in stomata",
                "JAZ repressors inhibit MYC transcription factors during normal conditions",
                "Cytosolic calcium oscillations activate SLAC1 channels through CDPK",
                "ABA induces NO production which enhances stomatal closure mechanisms"
              ];
            case 5:
              return [
                "Drought-induced ABA activates OST1 kinase which phosphorylates SLAC1 channels",
                "JA-induced MYC2 activation enhances ABA sensitivity in guard cells during combined stress",
                "ROS-dependent activation of MAPK cascade leads to calcium release from internal stores",
                "ABA-induced NO production activates cGMP signaling pathway in guard cells during drought",
                "Cytosolic calcium oscillations activate CPK6 which phosphorylates SLAC1 in guard cells",
                "JAZ repressors inhibit MYC2-mediated JA-ABA crosstalk under non-stress conditions",
                "Drought-induced ROS triggers calcium-dependent protein kinase signaling in stomata",
                "ABA and JA synergistically regulate SLAC1 through MYC2 and OST1 interaction",
                "NO-mediated cGMP signaling enhances calcium channel activity in guard cells",
                "MAPK cascade modulates ABA-induced stomatal closure through ROS amplification"
              ];
            default:
              return [];
          }
        }
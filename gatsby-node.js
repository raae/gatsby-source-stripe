let stripe = require("stripe");
const crypto = require("crypto");

const stribeObjectKeyToNodeType = stripeObjectKey => {
  return stripeObjectKey.charAt(0).toUpperCase() + stripeObjectKey.slice(1, -1);
};

const stripeItemToNode = (stripeItem, stripeObjectKey) => {
  return {
    ...stripeItem,
    id: `gatsby-source-stripe-${stripeItem.id}`,
    stripeId: stripeItem.id,
    internal: {
      type: `Stripe${stribeObjectKeyToNodeType(stripeObjectKey)}`,
      contentDigest: crypto
        .createHash(`md5`)
        .update(JSON.stringify(stripeItem))
        .digest(`hex`)
    }
  };
};

const defaultArgs = {
  limit: 100
};

exports.sourceNodes = async (
  { boundActionCreators },
  { objects = [], secretKey = "", args = {} }
) => {
  stripe = stripe(secretKey);
  const { createNode } = boundActionCreators;

  for (const stripeObjectKey of objects) {
    try {
      await stripe[stripeObjectKey]
        .list({
          ...defaultArgs,
          ...args[stripeObjectKey]
        })
        .autoPagingEach(function onItem(item) {
          const node = stripeItemToNode(item, stripeObjectKey);
          createNode(node);
        });
    } catch (error) {
      console.error(
        `Fetching list of ${stripeObjectKey} failed with error`,
        error.message
      );
    }
  }
};

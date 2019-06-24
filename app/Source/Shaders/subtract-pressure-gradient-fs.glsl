precision mediump float;

uniform float delta_time;
uniform float density;
uniform vec2 field_size;
uniform sampler2D pressure_field;
uniform sampler2D velocity_field;

varying vec2 surface_texcoord;

// WebGL 1.0 doesn't support use of the wrapping parameter GL_REPEAT for
// non-power-of-two texture sizes. This manually implements that feature.
vec4 sample_wrap(sampler2D input_sampler, vec2 texcoord)
{
    return texture2D(input_sampler, fract(texcoord));
}

void main()
{
    vec2 pixel_size = 1.0 / field_size;
    
    float west = sample_wrap(pressure_field, surface_texcoord - vec2(pixel_size.x, 0.0)).x;
    float east = sample_wrap(pressure_field, surface_texcoord + vec2(pixel_size.x, 0.0)).x;
    float south = sample_wrap(pressure_field, surface_texcoord - vec2(0.0, pixel_size.y)).x;
    float north = sample_wrap(pressure_field, surface_texcoord + vec2(0.0, pixel_size.y)).x;
    vec2 gradient = vec2(east - west, north - south);

    vec2 velocity = texture2D(velocity_field, surface_texcoord).xy;
    vec2 result = velocity - delta_time / (2.0 * density * pixel_size.x) * gradient;

    gl_FragColor = vec4(result, 0.0, 1.0);
}